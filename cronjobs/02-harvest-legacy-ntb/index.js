// @flow

import { performance } from 'perf_hooks'; // eslint-disable-line
import { MongoClient } from 'mongodb';
import type { Db } from 'mongodb';

import settings from '@turistforeningen/ntb-shared-settings';
import {
  createDriver,
  createSession,
} from '@turistforeningen/ntb-shared-neo4j-utils';
import {
  createLogger,
  startDuration,
  endDuration,
} from '@turistforeningen/ntb-shared-utils';
import { County, Municipality } from '@turistforeningen/ntb-shared-models';

import type {
  legacyTypes,
  handlerObj,
  legacyDocuments,
} from './lib/flow-types';

import legacy from './legacy-structure/legacy';
import verify from './lib/verify';
import processArea from './process/area';


const logger = createLogger();


// ######################################
// Flow types
// ######################################


type MongoDb = Db;


// ######################################
// Configuration
// ######################################


const LEGACY_TYPES: legacyTypes[] = [
  'områder',
  // 'lister',
  'grupper',
  // 'steder',
  // 'turer',
  // 'bilder',
];


// ######################################
// Harvest logic
// ######################################


/**
 * Get all documents from the specified collection from legacy-ntb MongoDB
 */
function getCollectionDocuments(db: MongoDb, collectionName: string) {
  return new Promise((resolve) => {
    const durationId = startDuration();
    const collection = db.collection(collectionName);

    collection.find({ status: { $ne: 'Slettet' } }).toArray((err, items) => {
      endDuration(
        durationId,
        `Fetching "${collectionName}" from mongodb done in`
      );
      resolve(items);
    });
  });
}


/**
 * Get all documents for all collections from legacy-ntb MongoDb
 */
async function getAllDocuments(
  db: MongoDb,
  handler: handlerObj
): Promise<void> {
  logger.info('Fetching all documents from mongodb (async)');
  const durationId = startDuration();
  const documents: legacyDocuments = {};

  await Promise.all(
    LEGACY_TYPES.map(async (type) => {
      documents[type] = await getCollectionDocuments(db, type);
      documents[type].forEach((document) => {
        document._id = document._id.toString();
      });
    })
  );

  handler.documents = documents;
  endDuration(durationId, 'Fetching all documents from mongodb done in');
}


/**
 * Verify structure of documents from legacy-ntb towards the defined structure.
 */
function verifyAllDocuments(handler: handlerObj): boolean {
  let verified = true;

  if (!handler.documents) {
    return false;
  }

  Object.keys(handler.documents).forEach((type) => {
    logger.info(`Verifying structure of <${type}>`);
    const { structure } = legacy[type];

    if (handler.documents && handler.documents[type]) {
      handler.documents[type].forEach((obj) => {
        const status = verify(obj, obj._id, structure);
        if (!status.verified) {
          verified = false;
          status.errors.forEach((e) => logger.error(e));
        }
      });
    }
    else {
      verified = false;
    }
  });

  return verified;
}


/**
 * Get all Counties and Municipalities
 */
async function getAllCM(handler: handlerObj): Promise<void> {
  if (handler.session) {
    const { session } = handler;

    logger.info('Fetching all counties from Neo4j');
    handler.counties = await County.findAll(session);

    logger.info('Fetching all municipalities from Neo4j');
    handler.municipalities = await Municipality.findAll(session);
  }
}


/**
 * Harvest data from legacy-ntb through it's MongoDB, verify the structure of
 * the data towards the defined legacy structure and map the data to Neo4j
 * nodes and relations.
 */
async function main(db: MongoDb): Promise<void> {
  const durationId = startDuration();
  const handler: handlerObj = {};

  await getAllDocuments(db, handler);

  if (!verifyAllDocuments(handler)) {
    throw new Error('Document verification failed.');
  }

  const driver = createDriver();
  const session = createSession(driver);
  handler.session = session;

  await getAllCM(handler);

  await processArea(handler);

  logger.info('Harvesting complete');
  endDuration(durationId);
  session.close();
  driver.close();
}


MongoClient.connect(settings.LEGACY_MONGO_DB_URI)
  .then(async (client) => {
    const db: MongoDb = client.db(settings.LEGACY_MONGO_DB_NAME);
    await main(db);
    client.close();
    process.exit(0);
  })
  .catch((err) => {
    logger.error('ERROR - some error occured');
    logger.error(err);
    logger.error(err.stack);
    process.exit(1);
  });

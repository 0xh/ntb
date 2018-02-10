import { MongoClient } from 'mongodb';

import * as settings from '@turistforeningen/ntb-shared-settings';
import {
  createLogger,
  startDuration,
  endDuration,
} from '@turistforeningen/ntb-shared-utils';
import db from '@turistforeningen/ntb-shared-models';

import * as legacy from './legacy-structure';
import verify from './lib/verify';
import processArea from './process/area';


const logger = createLogger();


// ######################################
// Configuration
// ######################################


const LEGACY_TYPES = [
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
function getCollectionDocuments(mongoDb, collectionName) {
  return new Promise((resolve) => {
    const durationId = startDuration();
    const collection = mongoDb.collection(collectionName);

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
async function getAllDocuments(handler) {
  logger.info('Fetching all documents from mongodb (async)');
  const durationId = startDuration();
  const documents = {};

  const mongoClient = await MongoClient.connect(settings.LEGACY_MONGO_DB_URI)
    .catch((err) => {
      logger.error('ERROR - some mongodb error occured');
      throw err;
    });

  const mongoDb = mongoClient.db(settings.LEGACY_MONGO_DB_NAME);

  await Promise.all(
    LEGACY_TYPES.map(async (type) => {
      documents[type] = await getCollectionDocuments(mongoDb, type);
      documents[type].forEach((document) => {
        document._id = document._id.toString();
      });
    })
  );

  mongoClient.close();

  handler.documents = documents;
  endDuration(durationId, 'Fetching all documents from mongodb done in');
}


/**
 * Verify structure of documents from legacy-ntb towards the defined structure.
 */
function verifyAllDocuments(handler) {
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
async function getAllCM(handler) {
  let durationId;

  logger.info('Fetching all counties from postgres');
  durationId = startDuration();
  handler.counties = await db.County.findAll();
  endDuration(durationId);

  logger.info('Fetching all municipalities from postgres');
  durationId = startDuration();
  handler.municipalities = await db.Municipality.findAll();
  endDuration(durationId);
}


/**
 * Harvest data from legacy-ntb through it's MongoDB, verify the structure of
 * the data towards the defined legacy structure and map the data to the
 * database models
 */
async function main() {
  const durationId = startDuration();
  const handler = {};

  await getAllDocuments(handler);

  if (!verifyAllDocuments(handler)) {
    throw new Error('Document verification failed.');
  }

  await getAllCM(handler);

  await processArea(handler);

  logger.info('Harvesting complete');
  endDuration(durationId);
}


main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('UNCAUGHT ERROR');
    logger.error(err);
    logger.error(err.stack);
    process.exit(1);
  });

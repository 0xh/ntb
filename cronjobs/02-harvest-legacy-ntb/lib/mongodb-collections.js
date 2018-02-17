import fs from 'fs';
import path from 'path';

import { MongoClient } from 'mongodb';

import * as settings from '@turistforeningen/ntb-shared-settings';
import {
  createLogger,
  startDuration,
  endDuration,
} from '@turistforeningen/ntb-shared-utils';


const LEGACY_TYPES = [
  'grupper',
  'områder',
  // 'lister',
  'steder',
  // 'turer',
  // 'bilder',
];


const logger = createLogger();
const testFilesFolder = path.resolve(__dirname, '..', 'test-data');


/**
 * Get all documents from the specified collection from legacy-ntb MongoDB
 */
function getCollectionDocuments(mongoDb, collectionName) {
  return new Promise((resolve) => {
    const durationId = startDuration();
    const collection = mongoDb.collection(collectionName);

    collection
      .find({ status: { $ne: 'Slettet' } })
      // .project({ geojson: 0 })
      .toArray((err, items) => {
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
async function getAllDocumentsFromMongoDb(handler) {
  logger.info('Fetching all documents from mongodb');
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
 * Get all documents for all collections from legacy-ntb MongoDb
 */
async function getAllDocumentsFromTestFiles(handler) {
  logger.warn('Fetching all documents from test files');
  const durationId = startDuration();
  const documents = {};

  LEGACY_TYPES.forEach((name) => {
    const p = path.resolve(testFilesFolder, `${name}.json`);
    const file = fs.readFileSync(p, 'utf-8');
    documents[name] = JSON.parse(file);
  });

  handler.documents = documents;
  endDuration(durationId, 'Fetching all documents from test files done in');
}


/**
 * Get all documents
 */
export default function getAllDocuments(handler, useTest = false) {
  if (useTest) {
    return getAllDocumentsFromTestFiles(handler);
  }

  return getAllDocumentsFromMongoDb(handler);
}


export async function downloadTestData() {
  const durationId = startDuration();
  const handler = {};
  await getAllDocuments(handler);

  // Create test-data folder if it does not exist
  if (!fs.existsSync(testFilesFolder)) {
    fs.mkdirSync(testFilesFolder);
  }

  // Save each json file
  Object.keys(handler.documents).forEach((name) => {
    logger.info(`Saving "${name}" to file`);
    fs.writeFileSync(
      path.resolve(testFilesFolder, `${name}.json`),
      JSON.stringify(handler.documents[name])
    );
  });

  logger.info('Creating test-data files done!');
  endDuration(durationId);
}

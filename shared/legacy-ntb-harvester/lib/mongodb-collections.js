import fs from 'fs';
import path from 'path';

import { MongoClient } from 'mongodb';

import * as settings from '@turistforeningen/ntb-shared-settings';
import {
  createLogger,
  startDuration,
  endDuration,
} from '@turistforeningen/ntb-shared-utils';


const logger = createLogger();
const testFilesFolder = path.resolve(__dirname, '..', 'test-data');


/**
 * Get document count from the specified collection from legacy-ntb MongoDB
 */
async function getCollectionCount(mongoDb, collectionName, filter) {
  return new Promise((resolve) => {
    const durationId = startDuration();
    const collection = mongoDb.collection(collectionName);

    const count = collection.find({
      status: { $ne: 'Slettet' },
      ...(filter || {}),
    }).count();
    endDuration(durationId);
    resolve(count);
  });
}


/**
 * Get documents from the specified collection from legacy-ntb MongoDB
 */
function getCollectionDocuments(
  mongoDb,
  collectionName,
  skip,
  limit,
  filter,
  project
) {
  return new Promise((resolve) => {
    const durationId = startDuration();
    const collection = mongoDb.collection(collectionName);

    const query = collection.find({
      status: { $ne: 'Slettet' },
      ...(filter || {}),
    });

    if (skip || limit) {
      query.skip(skip).limit(limit).project(project || {});
    }

    query.toArray((err, items) => {
      endDuration(
        durationId,
        `Fetching "${collectionName}" from mongodb done in`
      );

      resolve(items);
    });
  });
}


/**
 * Get count of documents for a collection from legacy-ntb MongoDb
 */
export async function getDocumentCountFromMongoDb(type, filter) {
  logger.info(`Fetching document count from mongodb of "${type}"`);
  const durationId = startDuration();

  const mongoClient = await MongoClient.connect(settings.LEGACY_MONGO_DB_URI)
    .catch((err) => {
      logger.error('ERROR - some mongodb error occured');
      throw err;
    });

  const mongoDb = mongoClient.db(settings.LEGACY_MONGO_DB_NAME);
  const count = await getCollectionCount(mongoDb, type, filter);
  logger.info(`"${type}" count: ${count}`);

  mongoClient.close();
  endDuration(durationId);
}


/**
 * Get all documents for all collections from legacy-ntb MongoDb
 */
async function getAllDocumentsFromMongoDb(handler, types) {
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
    types.map(async (type) => {
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
 * Get documents for a collection from legacy-ntb MongoDb
 * with skip and limit options
 */
export async function getDocumentsFromMongoDb(
  handler,
  type,
  skip,
  limit = 100,
  filter = {},
  project = {},
) {
  logger.info(
    `Fetching "${type}" from mongodb (limit: ${limit}, skip: ${skip})`
  );
  const mongoClient = await MongoClient.connect(settings.LEGACY_MONGO_DB_URI)
    .catch((err) => {
      logger.error('ERROR - some mongodb error occured');
      throw err;
    });

  const mongoDb = mongoClient.db(settings.LEGACY_MONGO_DB_NAME);

  const documents = await getCollectionDocuments(
    mongoDb, type, skip, limit, filter, project
  );
  documents.forEach((document) => {
    document._id = document._id.toString();
  });

  mongoClient.close();

  handler.documents[type] = documents;
}


/**
 * Get all documents for all collections from legacy-ntb MongoDb
 */
async function getAllDocumentsFromTestFiles(handler, types) {
  logger.warn('Fetching all documents from test files');
  const durationId = startDuration();
  const documents = {};

  types.forEach((name) => {
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
export default function getAllDocuments(handler, types, useTest = false) {
  if (useTest) {
    return getAllDocumentsFromTestFiles(handler, types);
  }

  return getAllDocumentsFromMongoDb(handler, types);
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

import {
  createLogger,
  startDuration,
  endDuration,
} from '@turistforeningen/ntb-shared-utils';
import db from '@turistforeningen/ntb-shared-models';

import * as legacy from './legacy-structure';
import verify from './lib/verify';
import getAllDocuments, {
  getDocumentCountFromMongoDb,
  getDocumentsFromMongoDb,
} from './lib/mongodb-collections';
import processArea from './process/area';
import processGroup from './process/group';
import processCabin from './process/cabin';
import processPoi from './process/poi';
import processTrip from './process/trip';


const logger = createLogger();


/**
 * Verify structure of documents in specified document type
 * from legacy-ntb towards the defined structure.
 */
function verifyDocuments(handler, type) {
  let verified = true;

  if (!handler.documents) {
    return false;
  }

  handler.documents[type] = handler.documents[type].filter((d) => !d.err);

  logger.info(`Verifying structure of <${type}>`);
  const { structure } = legacy[type];
  const cabinStructure = legacy.hytter.structure;

  if (handler.documents && handler.documents[type]) {
    handler.documents[type].forEach((obj) => {
      let s = structure;
      if (type === 'steder' && obj.tags && obj.tags[0] === 'Hytte') {
        s = cabinStructure;
      }

      const status = verify(obj, obj._id, s);
      if (!status.verified) {
        verified = false;
        status.errors.forEach((e) => logger.error(e));
      }
    });
  }
  else {
    verified = false;
  }

  return verified;
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
    if (!verifyDocuments(handler, type)) {
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

  const where = {
    status: 'public',
  };

  logger.info('Fetching all counties from postgres');
  durationId = startDuration();
  handler.counties = await db.County.findAll({ where });
  endDuration(durationId);

  logger.info('Fetching all municipalities from postgres');
  durationId = startDuration();
  handler.municipalities = await db.Municipality.findAll({ where });
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

  let useTestData = false;
  if (process.argv.length > 2 && process.argv[2].trim() === 'testdata') {
    useTestData = true;
  }
  await getAllDocuments(
    handler,
    // ['grupper', 'områder', 'steder'/* , lister, bilder */],
    [],
    useTestData
  );

  if (!verifyAllDocuments(handler)) {
    throw new Error('Document verification failed.');
  }

  await getAllCM(handler);

  // await processArea(handler);
  // await processGroup(handler);
  // await processCabin(handler);
  // await processPoi(handler);

  // Get and process photos
  let limit = 1000;
  let skip = 0;
  let first = true;

  // while (first || handler.documents.bilder.length > 0) {
  //   first = false;
  //   await getDocumentsFromMongoDb(handler, 'bilder', skip, limit); // eslint-disable-line
  //   const status = verifyDocuments(handler, 'bilder');
  //   if (!status) {
  //     throw new Error('Document verification failed.');
  //   }
  //   skip += limit;
  // }

  // Get and process trips
  limit = 1000;
  skip = 0;
  first = true;

  await getDocumentCountFromMongoDb('turer');

  while (first || handler.documents.turer.length > 0) {
    first = false;
    await getDocumentsFromMongoDb(handler, 'turer', skip, limit); // eslint-disable-line

    // On a few objects, the coordines are string and not number. This causes
    // the geojson verification to fail.
    handler.documents.turer.forEach((t) => {
      if (t.privat && t.privat.startpunkt && t.privat.startpunkt.coordinates) {
        t.privat.startpunkt.coordinates = t.privat.startpunkt.coordinates
          .map((c) => +c);
      }
    });

    const status = verifyDocuments(handler, 'turer');
    if (!status) {
      throw new Error('Document verification failed for trips.');
    }

    await processTrip(handler); // eslint-disable-line
    skip += limit;
  }

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

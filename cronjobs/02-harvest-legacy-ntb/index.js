import {
  createLogger,
  startDuration,
  endDuration,
} from '@turistforeningen/ntb-shared-utils';
import db from '@turistforeningen/ntb-shared-models';

import * as legacy from './legacy-structure';
import verify from './lib/verify';
import getAllDocuments from './lib/mongodb-collections';
import processArea from './process/area';
import processGroup from './process/group';
import processCabin from './process/cabin';
import processPoi from './process/poi';


const logger = createLogger();


/**
 * Verify structure of documents from legacy-ntb towards the defined structure.
 */
function verifyAllDocuments(handler) {
  let verified = true;

  if (!handler.documents) {
    return false;
  }

  Object.keys(handler.documents).forEach((type) => {
    // remove any objects wit "err"
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
    ['grupper', 'områder', 'steder'/* , lister, bilder */],
    useTestData
  );

  if (!verifyAllDocuments(handler)) {
    throw new Error('Document verification failed.');
  }

  await getAllCM(handler);

  await processArea(handler);
  await processGroup(handler);
  await processCabin(handler);
  await processPoi(handler);

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

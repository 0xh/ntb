import moment from 'moment';

import {
  createLogger,
  startDuration,
  endDuration,
} from '@turistforeningen/ntb-shared-utils';

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
import processTrip, { mapTripData } from './process/trip';
import processRoute, { mapRouteData } from './process/route';
import processPicture, { mapPictureData } from './process/picture';
import processList, { mapListData } from './process/list';


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
 * Harvest areas
 */
export async function harvestAreas(useTestData = false) {
  const durationId = startDuration();
  const handler = {};

  await getAllDocuments(handler, ['områder'], useTestData);

  const status = verifyDocuments(handler, 'områder');
  if (!status) {
    throw new Error('Document verification failed for areas.');
  }

  await processArea(handler);

  logger.info('Harvesting complete');
  endDuration(durationId);
}


/**
 * Harvest groups
 */
export async function harvestGroups(useTestData = false) {
  const durationId = startDuration();
  const handler = {};

  await getAllDocuments(handler, ['grupper'], useTestData);

  const status = verifyDocuments(handler, 'grupper');
  if (!status) {
    throw new Error('Document verification failed for groups.');
  }

  await processGroup(handler);

  logger.info('Harvesting complete');
  endDuration(durationId);
}


/**
 * Harvest cabins
 */
export async function harvestCabin(useTestData = false) {
  const durationId = startDuration();
  const handler = { documents: {} };
  const filter = { 'tags.0': 'Hytte' };

  // await getAllDocuments(handler, ['steder'], useTestData);
  await getDocumentsFromMongoDb(handler, 'steder', null, null, filter);

  const status = verifyDocuments(handler, 'steder');
  if (!status) {
    throw new Error('Document verification failed for cabins');
  }

  await processCabin(handler);

  logger.info('Harvesting complete');
  endDuration(durationId);
}


export async function harvestPoi(useTestData = false) {
  const durationId = startDuration();
  const handler = { documents: {} };
  const filter = {
    $or: [
      { 'tags.0': { $ne: 'Hytte' } },
      { tags: null },
    ],
  };

  // await getAllDocuments(handler, ['steder'], useTestData);
  await getDocumentsFromMongoDb(handler, 'steder', null, null, filter);

  const status = verifyDocuments(handler, 'steder');
  if (!status) {
    throw new Error('Document verification failed for pois');
  }

  await processPoi(handler);

  logger.info('Harvesting complete');
  endDuration(durationId);
}


/**
 * Harvest routes
 */
export async function harvestRoute(useTestData = false) {
  const durationId = startDuration();
  const handler = { documents: {} };
  const limit = 5000;
  const filter = { 'rute.kode': { $ne: null } };
  const project = { geojson: 0 };
  let skip = 0;
  let first = true;
  handler.timeStamp = moment().format('YYYYMMDDHHmmssSSS');

  await getDocumentCountFromMongoDb('turer', filter);

  while (first || handler.documents.turer.length > 0) {
    // eslint-disable-next-line
    await getDocumentsFromMongoDb(
      handler, 'turer', skip, limit, filter, project
    );
    handler.documents.ruter = handler.documents.turer;

    // On a few objects, the coordines are string and not number. This causes
    // the geojson verification to fail.
    handler.documents.ruter.forEach((t) => {
      if (t.privat && t.privat.startpunkt && t.privat.startpunkt.coordinates) {
        t.privat.startpunkt.coordinates = t.privat.startpunkt.coordinates
          .map((c) => +c);
      }
    });

    const status = verifyDocuments(handler, 'ruter');
    if (!status) {
      throw new Error('Document verification failed for routes.');
    }

    // eslint-disable-next-line
    await mapRouteData(handler, first);
    first = false;
    skip += limit;
  }

  await processRoute(handler);

  logger.info('Harvesting complete');
  endDuration(durationId);
}


/**
 * Harvest trips
 */
export async function harvestTrip(useTestData = false) {
  const durationId = startDuration();
  const handler = { documents: {} };
  const limit = 1000;
  const filter = { 'rute.kode': null };
  let skip = 0;
  let first = true;
  handler.timeStamp = moment().format('YYYYMMDDHHmmssSSS');

  await getDocumentCountFromMongoDb('turer', filter);

  while (first || handler.documents.turer.length > 0) {
    // eslint-disable-next-line
    await getDocumentsFromMongoDb(handler, 'turer', skip, limit, filter);

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

    // eslint-disable-next-line
    await mapTripData(handler, first);
    first = false;
    skip += limit;
  }

  await processTrip(handler);

  logger.info('Harvesting complete');
  endDuration(durationId);
}


/**
 * Harvest pictures
 */
export async function harvestPictures(useTestData = false) {
  const durationId = startDuration();
  const handler = { documents: {} };
  const limit = 2000;
  const filter = { status: 'Offentlig' };
  let skip = 0;
  let first = true;
  handler.timeStamp = moment().format('YYYYMMDDHHmmssSSS');

  await getDocumentCountFromMongoDb('bilder', filter);

  while (first || handler.documents.bilder.length > 0) {
    // eslint-disable-next-line
    await getDocumentsFromMongoDb(handler, 'bilder', skip, limit, filter);

    const status = verifyDocuments(handler, 'bilder');
    if (!status) {
      throw new Error('Document verification failed for pictures.');
    }

    // eslint-disable-next-line
    await mapPictureData(handler, first);
    first = false;
    skip += limit;
  }

  await processPicture(handler);

  logger.info('Harvesting complete');
  endDuration(durationId);
}


/**
 * Harvest lists
 */
export async function harvestLists(useTestData = false) {
  const durationId = startDuration();
  const handler = { documents: {} };
  const limit = 2000;
  const filter = { };
  let skip = 0;
  let first = true;
  handler.timeStamp = moment().format('YYYYMMDDHHmmssSSS');
  // handler.timeStamp = '20180328071216667'; // TODO(Roar): REMOVE THIS!

  await getDocumentCountFromMongoDb('lister', filter);

  while (first || handler.documents.lister.length > 0) {
    // eslint-disable-next-line
    await getDocumentsFromMongoDb(handler, 'lister', skip, limit, filter);

    const status = verifyDocuments(handler, 'lister');
    if (!status) {
      throw new Error('Document verification failed for lists.');
    }

    // eslint-disable-next-line
    await mapListData(handler, first);
    first = false;
    skip += limit;
  }

  await processList(handler);

  logger.info('Harvesting complete');
  endDuration(durationId);
}

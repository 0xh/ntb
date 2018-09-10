import {
  Logger,
  startDuration,
  printDuration,
  moment,
} from '@ntb/utils';

import * as legacy from './legacy-structure';
import verify from './lib/verify';
import {
  getDocumentCountFromMongoDb,
  getDocumentsFromMongoDb,
} from './lib/mongodb-collections';
import processArea, { mapAreaData } from './process/area';
import processGroup, { mapGroupData } from './process/group';
import processCabin, { mapCabinData } from './process/cabin';
import processPoi, { mapPoiData } from './process/poi';
import processTrip, { mapTripData } from './process/trip';
import processRoute, { mapRouteData } from './process/route';
import processPicture, { mapPictureData } from './process/picture';
import processList, { mapListData } from './process/list';


const logger = Logger.getLogger();


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
export async function harvestAreas(limit = 2000, fullHarvest = false) {
  const durationId = startDuration();
  const handler = { documents: {} };
  const filter = { };
  if (!fullHarvest) {
    const now = new Date();
    now.setHours(now.getHours() - 2);
    filter.endret = { $gte: now.toISOString() };
  }
  let skip = 0;
  let first = true;
  handler.timeStamp = moment().format('YYYYMMDDHHmmssSSS');

  logger.info(`Doing a ${fullHarvest ? 'full' : 'partial'} harvest of areas`);

  const count = await getDocumentCountFromMongoDb('områder', filter);
  if (!count) {
    logger.info('No records found');
    return;
  }

  while (first || handler.documents.områder.length > 0) {
    // eslint-disable-next-line
    await getDocumentsFromMongoDb(handler, 'områder', skip, limit, filter);

    const status = verifyDocuments(handler, 'områder');
    if (!status) {
      throw new Error('Document verification failed for areas.');
    }

    // eslint-disable-next-line
    await mapAreaData(handler, first);
    first = false;
    skip += limit;
  }

  await processArea(handler, fullHarvest);

  logger.info('Harvesting complete');
  printDuration(durationId);
}


/**
 * Harvest groups
 */
export async function harvestGroups(limit = 2000, fullHarvest = false) {
  const durationId = startDuration();
  const handler = { documents: {} };
  const filter = { };
  if (!fullHarvest) {
    const now = new Date();
    now.setHours(now.getHours() - 2);
    filter.endret = { $gte: now.toISOString() };
  }
  let skip = 0;
  let first = true;
  handler.timeStamp = moment().format('YYYYMMDDHHmmssSSS');

  logger.info(`Doing a ${fullHarvest ? 'full' : 'partial'} harvest of groups`);

  const count = await getDocumentCountFromMongoDb('grupper', filter);
  if (!count) {
    logger.info('No records found');
    return;
  }

  while (first || handler.documents.grupper.length > 0) {
    // eslint-disable-next-line
    await getDocumentsFromMongoDb(handler, 'grupper', skip, limit, filter);

    const status = verifyDocuments(handler, 'grupper');
    if (!status) {
      throw new Error('Document verification failed for groups.');
    }

    // eslint-disable-next-line
    await mapGroupData(handler, first);
    first = false;
    skip += limit;
  }

  await processGroup(handler, fullHarvest);

  logger.info('Harvesting complete');
  printDuration(durationId);
}


/**
 * Harvest cabins
 */
export async function harvestCabin(limit = 2000, fullHarvest = false) {
  const durationId = startDuration();
  const handler = { documents: {} };
  const filter = { 'tags.0': 'Hytte' };
  if (!fullHarvest) {
    const now = new Date();
    now.setHours(now.getHours() - 2);
    filter.endret = { $gte: now.toISOString() };
  }

  let skip = 0;
  let first = true;
  handler.timeStamp = moment().format('YYYYMMDDHHmmssSSS');

  logger.info(`Doing a ${fullHarvest ? 'full' : 'partial'} harvest of cabins`);

  const count = await getDocumentCountFromMongoDb('steder', filter);
  if (!count) {
    logger.info('No records found');
    return;
  }

  while (first || handler.documents.steder.length > 0) {
    // eslint-disable-next-line
    await getDocumentsFromMongoDb(handler, 'steder', skip, limit, filter);

    const status = verifyDocuments(handler, 'steder');
    if (!status) {
      throw new Error('Document verification failed for cabins.');
    }

    // eslint-disable-next-line
    await mapCabinData(handler, first);
    first = false;
    skip += limit;
  }

  await processCabin(handler, fullHarvest);

  logger.info('Harvesting complete');
  printDuration(durationId);
}


export async function harvestPoi(limit = 2000, fullHarvest = false) {
  const durationId = startDuration();
  const handler = { documents: {} };
  const filter = {
    $or: [
      { 'tags.0': { $ne: 'Hytte' } },
      { tags: null },
    ],
  };
  if (!fullHarvest) {
    const now = new Date();
    now.setHours(now.getHours() - 2);
    filter.endret = { $gte: now.toISOString() };
  }
  let skip = 0;
  let first = true;
  handler.timeStamp = moment().format('YYYYMMDDHHmmssSSS');

  logger.info(`Doing a ${fullHarvest ? 'full' : 'partial'} harvest of pois`);

  const count = await getDocumentCountFromMongoDb('steder', filter);
  if (!count) {
    logger.info('No records found');
    return;
  }

  while (first || handler.documents.steder.length > 0) {
    // eslint-disable-next-line
    await getDocumentsFromMongoDb(handler, 'steder', skip, limit, filter);

    const status = verifyDocuments(handler, 'steder');
    if (!status) {
      throw new Error('Document verification failed for pois.');
    }

    // eslint-disable-next-line
    await mapPoiData(handler, first);
    first = false;
    skip += limit;
  }

  await processPoi(handler, fullHarvest);

  logger.info('Harvesting complete');
  printDuration(durationId);
}


/**
 * Harvest routes
 */
export async function harvestRoute(limit = 2000, fullHarvest = false) {
  const durationId = startDuration();
  const handler = { documents: {} };
  const filter = { 'rute.kode': { $ne: null } };
  if (!fullHarvest) {
    const now = new Date();
    now.setHours(now.getHours() - 2);
    filter.endret = { $gte: now.toISOString() };
  }
  const project = { geojson: 0 };
  let skip = 0;
  let first = true;
  handler.timeStamp = moment().format('YYYYMMDDHHmmssSSS');

  logger.info(`Doing a ${fullHarvest ? 'full' : 'partial'} harvest of routes`);

  const count = await getDocumentCountFromMongoDb('turer', filter);
  if (!count) {
    logger.info('No records found');
    return;
  }

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

  await processRoute(handler, fullHarvest);

  logger.info('Harvesting complete');
  printDuration(durationId);
}


/**
 * Harvest trips
 */
export async function harvestTrip(limit = 2000, fullHarvest = false) {
  const durationId = startDuration();
  const handler = { documents: {} };
  const filter = { 'rute.kode': null };
  if (!fullHarvest) {
    const now = new Date();
    now.setHours(now.getHours() - 2);
    filter.endret = { $gte: now.toISOString() };
  }
  let skip = 0;
  let first = true;
  handler.timeStamp = moment().format('YYYYMMDDHHmmssSSS');

  logger.info(`Doing a ${fullHarvest ? 'full' : 'partial'} harvest of trips`);

  const count = await getDocumentCountFromMongoDb('turer', filter);
  if (!count) {
    logger.info('No records found');
    return;
  }

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

  await processTrip(handler, fullHarvest);

  logger.info('Harvesting complete');
  printDuration(durationId);
}


/**
 * Harvest pictures
 */
export async function harvestPictures(limit = 2000, fullHarvest = false) {
  const durationId = startDuration();
  const handler = { documents: {} };
  const filter = { status: 'Offentlig' };
  if (!fullHarvest) {
    const now = new Date();
    now.setHours(now.getHours() - 2);
    filter.endret = { $gte: now.toISOString() };
  }
  let skip = 0;
  let first = true;
  handler.timeStamp = moment().format('YYYYMMDDHHmmssSSS');

  logger.info(
    `Doing a ${fullHarvest ? 'full' : 'partial'} harvest of pictures`
  );

  const count = await getDocumentCountFromMongoDb('bilder', filter);
  if (!count) {
    logger.info('No records found');
    return;
  }

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
  printDuration(durationId);
}


/**
 * Harvest lists
 */
export async function harvestLists(limit = 2000, fullHarvest = false) {
  const durationId = startDuration();
  const handler = { documents: {} };
  const filter = { };
  if (!fullHarvest) {
    const now = new Date();
    now.setHours(now.getHours() - 2);
    filter.endret = { $gte: now.toISOString() };
  }
  let skip = 0;
  let first = true;
  handler.timeStamp = moment().format('YYYYMMDDHHmmssSSS');

  logger.info(`Doing a ${fullHarvest ? 'full' : 'partial'} harvest of lists`);

  const count = await getDocumentCountFromMongoDb('lister', filter);
  if (!count) {
    logger.info('No records found');
    return;
  }

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

  await processList(handler, fullHarvest);

  logger.info('Harvesting complete');
  printDuration(durationId);
}

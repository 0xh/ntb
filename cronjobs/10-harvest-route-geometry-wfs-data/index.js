import {
  createLogger,
  startDuration,
  endDuration,
} from '@turistforeningen/ntb-shared-utils';
import wfsDownload from '@turistforeningen/ntb-shared-wfs-utils/download';
import { SystemSettings } from '@turistforeningen/ntb-shared-models';
import { knex } from '@turistforeningen/ntb-shared-db-utils';


const logger = createLogger();


const SYSTEM_SETTINGS_NAME = 'routes-wfs';
const SRS_NAME = 'EPSG:25833';
const TYPES = {
  ski: {
    wfsType: 'app:Skiløype',
    routeType: 'ski',
    table: 'routes_wfs_data_ski',
  },
  foot: {
    wfsType: 'app:Fotrute',
    routeType: 'foot',
    table: 'routes_wfs_data_foot',
  },
  bike: {
    wfsType: 'app:Sykkelrute',
    routeType: 'bike',
    table: 'routes_wfs_data_bike',
  },
  other: {
    wfsType: 'app:AnnenRute',
    routeType: 'other',
    table: 'routes_wfs_data_other',
  },
};


async function updateSystemSettings(settings) {
  logger.info('Saving system settings changes');
  await SystemSettings
    .query()
    .patch({ settings })
    .where('name', SYSTEM_SETTINGS_NAME);
}


async function getSystemSettings() {
  logger.info('Fetching system settings');
  const result = await SystemSettings.getSettings(SYSTEM_SETTINGS_NAME);
  const { settings } = result;

  let updated = false;
  Object.keys(TYPES).forEach((type) => {
    const { routeType } = TYPES[type];
    if (!settings[routeType]) {
      settings[routeType] = {};
      updated = true;
    }
  });

  if (updated) {
    await updateSystemSettings(settings);
  }

  return settings;
}


async function truncateWfsData(table) {
  await knex.raw(`TRUNCATE TABLE "public"."${table}"`);
}


async function downloadWfsData(wfsType, table) {
  logger.debug('Downloading wfs data');
  const durationId = startDuration();

  const wfs = (
    'http://wfs.geonorge.no/skwms1/wfs.turogfriluftsruter?service=WFS' +
    `&version=2.0.0&request=GetFeature&typeName=${wfsType}&srsName=${SRS_NAME}`
  );

  const status = await wfsDownload(wfs, table);

  if (status === false) {
    throw new Error('Downloading wfs failed.');
  }

  endDuration(durationId);
}


async function processRouteType(type, settings) {
  const { wfsType, routeType, table } = type;

  logger.info(`Process routes of type '${routeType}'`);
  const durationId = startDuration();

  settings[routeType].downloadStart = new Date().toISOString();

  await truncateWfsData(table);
  await downloadWfsData(wfsType, table);

  settings[routeType].downloadEnd = new Date().toISOString();
  await updateSystemSettings(settings);

  endDuration(durationId);
}


async function main() {
  const durationId = startDuration();
  const settings = await getSystemSettings();
  await processRouteType(TYPES.ski, settings);
  await processRouteType(TYPES.bike, settings);
  await processRouteType(TYPES.other, settings);
  await processRouteType(TYPES.foot, settings);

  await updateSystemSettings(settings);
  endDuration(durationId);
}


main()
  .then((res) => {
    logger.debug('ALL DONE');
    process.exit(0);
  })
  .catch((err) => {
    logger.error('UNCAUGHT ERROR');
    logger.error(err);
    logger.error(err.stack);
    process.exit(1);
  });

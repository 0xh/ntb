import fetch from 'isomorphic-fetch';
import moment from 'moment';

import { createLogger } from '@turistforeningen/ntb-shared-utils';
import { knex, Model } from '@turistforeningen/ntb-shared-db-utils';
import { geomFromGeoJSON } from '@turistforeningen/ntb-shared-gis-utils';


const logger = createLogger();

const HAZARD_TYPES = [
  {
    type: 'avalanche',
    url: (
      'https://api01.nve.no/hydrology/forecast/avalanche/v4.0.0/api/Region/'
    ),
  },

  // The 'landslide' and 'flood' region data does not have polygons... :-(

  // {
  //   type: 'landslide',
  //   url: (
  //     'https://api01.nve.no/hydrology/forecast/landslide/v1.0.4/api/Region/'
  //   ),
  // },
  // {
  //   type: 'flood',
  //   url: (
  //     'https://api01.nve.no/hydrology/forecast/avalanche/v1.0.4/api/Region/'
  //   ),
  // },
];


async function createTempTable(suffix) {
  const timeStamp = moment().format('YYYYMMDDHHmmssSSS');
  const tableName = `0_${timeStamp}_hazard_${suffix}`;

  logger.info(`Creating temp table: ${tableName}`);

  await knex.schema.createTable(tableName, (table) => {
    table.increments('id');
    table.text('type');
    table.integer('regionId');
    table.text('name');
    table.integer('regionTypeId');
    table.text('regionType');
    table.specificType('geometry', 'GEOMETRY');
  });

  class TempModel extends Model {
    static tableName = tableName;
  }
  return TempModel;
}


function processData(type, rawData) {
  const data = [];

  rawData.forEach((d) => {
    // Create coordineates from that weird format from NVE
    const coordinates = [];
    const rawCoordinates = d.Polygon.map((p) => p.split(','));
    rawCoordinates.forEach((c) => {
      const first = +c.shift();
      const last = +c.splice(-1, 1);
      coordinates.push([
        [first, last],
        ...c.map((a) => a.split(' ').map((b) => +b)),
        [first, last],
      ]);
    });

    data.push({
      type,
      regionId: d.Id,
      name: d.Name,
      regionTypeId: d.TypeId,
      regionType: d.TypeName,
      geometry: geomFromGeoJSON({
        type: 'Polygon',
        coordinates,
      }),
    });
  });

  return data;
}


async function deleteTempTable(tableName) {
  await knex.schema.dropTableIfExists(tableName);
}


async function harvestToTempTable(type, url) {
  logger.info(`Fetching data from API for ${type}`);

  const response = await fetch(url, {
    method: 'GET',
    accept: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status !== 200) {
    logger.warn(`Invalid status code from API: ${response.status}`);
  }

  const rawData = await response.json();
  logger.info('API data fetched successfully');

  const tempModel = await createTempTable(type);
  const data = processData(type, rawData);

  await tempModel
    .query()
    .insert(data);

  return tempModel.tableName;
}


async function processType({ type, url }) {
  const tableName = await harvestToTempTable(type, url);

  logger.info('Updating hazard_region data');

  // Merge into production table
  await knex.raw([
    'INSERT INTO hazard_regions (',
    '  id,',
    '  type,',
    '  name,',
    '  region_id,',
    '  region_type_id,',
    '  region_type,',
    '  geometry',
    ')',
    'SELECT',
    '  uuid_generate_v4(),',
    '  a."type",',
    '  a."name",',
    '  a."region_id",',
    '  a."region_type_id",',
    '  a."region_type",',
    '  a."geometry"',
    `FROM "${tableName}" a`,
    'ON CONFLICT ("type", region_id) DO UPDATE SET',
    '  name = EXCLUDED.name,',
    '  region_type_id = EXCLUDED.region_type_id,',
    '  region_type = EXCLUDED.region_type,',
    '  geometry = EXCLUDED.geometry',
  ].join('\n'));

  logger.info('Deleting temp table');
  await deleteTempTable(tableName);
}


async function processHazardRegions() {
  const promises = HAZARD_TYPES.map((h) => processType(h));
  await Promise.all(promises);
}


processHazardRegions()
  .then((res) => {
    logger.info('Completed harvesting hazard regions');
    process.exit(0);
  })
  .catch((err) => {
    logger.error('UNCAUGHT ERROR');
    logger.error(err);
    logger.error(err.stack);
    process.exit(1);
  });

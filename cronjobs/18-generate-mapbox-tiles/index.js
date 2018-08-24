import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

import { createLogger } from '@turistforeningen/ntb-shared-utils';
import { knex } from '@turistforeningen/ntb-shared-db-utils';
import * as models from '@turistforeningen/ntb-shared-models';


const logger = createLogger();
const DATA_DIR = path.resolve(__dirname, 'data');
const SPAWN_SYNC_OPTIONS = {
  cwd: process.cwd(),
  env: process.env,
  shell: 'bash',
  stdio: 'pipe',
  encoding: 'utf-8',
};

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}


async function createGeojsonCabins() {
  const instances = await models.Cabin
    .query()
    .select(
      'id',
      knex.raw('ST_AsGeoJSON(coordinates) coordinates'),
      'name',
      'dntCabin',
      'serviceLevel',
      'htgtPublicTransportAvailable',
      'htgtBoatTransportAvailable',
      'htgtCarAllYear',
      'htgtCarSummer',
      'htgtBicycle',
    )
    .eager('facilities', 'accessabilities')
    .whereNotNull('coordinates')
    .where('status', '=', 'public')
    .orderBy('id');

  const cabins = instances.map((instance) => ({
    type: 'Feature',
    properties: {
      id: instance.id,
      name: instance.name,
      dnt_cabin: instance.dntCabin,
      service_level: instance.serviceLevel,
      htgt: {
        public_transport_available: instance.htgtPublicTransportAvailable,
        boat_transport_available: instance.htgtBoatTransportAvailable,
        car_all_year: instance.htgtCarAllYear,
        car_summer: instance.htgtCarSummer,
        bicycle: instance.htgtCarBicycle,
      },
      accessabilities: (instance.accessabilities || []).map((a) => a.name),
      facilities: (instance.facilities || []).map((f) => f.name),
    },
    geometry: instance.coordinates,
  }));

  fs.writeFileSync(
    path.resolve(DATA_DIR, 'cabins.geojson'),
    JSON.stringify({
      type: 'FeatureCollection',
      features: cabins,
    }),
    'utf-8'
  );
}


async function tippecanoeCabins() {
  const status = spawnSync('tippecanoe', [
    '-o',
    path.resolve(DATA_DIR, 'cabins.mbtiles'),
    '-f',
    '-B',
    7,
    '-r2',
    path.resolve(DATA_DIR, 'cabins.geojson'),
  ], SPAWN_SYNC_OPTIONS);

  let error = false;
  if (status.status !== 0 || status.stderr) {
    logger.warn(`ogr2ogr failed - status ${status.status}!`);
    error = true;
  }

  logger.info('ogr2ogr output start:');
  status.output.filter((o) => o).forEach((o) => {
    logger.info(o);
  });
  logger.info('ogr2ogr output end');

  return error;
}


async function joinTiles() {
  const status = spawnSync('tile-join', [
    '-o',
    path.resolve(DATA_DIR, 'ut.mbtiles'),
    path.resolve(DATA_DIR, 'cabins.mbtiles'),
  ]);

  let error = false;
  if (status.status !== 0 || status.stderr) {
    logger.warn(`ogr2ogr failed - status ${status.status}!`);
    error = true;
  }

  logger.info('ogr2ogr output start:');
  status.output.filter((o) => o).forEach((o) => {
    logger.info(o);
  });
  logger.info('ogr2ogr output end');

  return error;
}


async function main() {
  await createGeojsonCabins();
  await tippecanoeCabins();
  await joinTiles();
}


main()
  .then((res) => {
    logger.info('ALL DONE');
    process.exit(0);
  })
  .catch((err) => {
    logger.error('UNCAUGHT ERROR');
    logger.error(err);
    logger.error(err.stack);
    process.exit(1);
  });

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

import {
  createLogger,
  startDuration,
  endDuration,
} from '@turistforeningen/ntb-shared-utils';
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
const TIPPECANOE_OPTIONS = {
  cabins: [
    '-o',
    path.resolve(DATA_DIR, 'cabins.mbtiles'),
    '-f',
    '-B',
    7,
    '-r2',
    path.resolve(DATA_DIR, 'cabins.geojson'),
  ],
  trips: [
    '-o',
    path.resolve(DATA_DIR, 'trips.mbtiles'),
    '-f',
    '-B',
    7,
    '-r2',
    path.resolve(DATA_DIR, 'trips.geojson'),
  ],
  pois: [
    '-o',
    path.resolve(DATA_DIR, 'pois.mbtiles'),
    '-f',
    '-B',
    7,
    '-r2',
    path.resolve(DATA_DIR, 'pois.geojson'),
  ],
  routes: [
    '-o',
    path.resolve(DATA_DIR, 'routes.mbtiles'),
    '-f',
    '-B',
    8,
    path.resolve(DATA_DIR, 'routesfoot.geojson'),
    path.resolve(DATA_DIR, 'routesfootpoints.geojson'),
    path.resolve(DATA_DIR, 'routesski.geojson'),
    path.resolve(DATA_DIR, 'routesskipoints.geojson'),
  ],
};


if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}


async function createGeojsonCabins() {
  logger.info('Create geojson for cabins');
  const durationId = startDuration();

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
      ikon: 'betjent-dnt',
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

  logger.info('Done');
  endDuration(durationId);
}


async function createGeojsonPois() {
  logger.info('Create geojson for pois');
  const durationId = startDuration();

  const instances = await models.Poi
    .query()
    .select(
      'id',
      knex.raw('ST_AsGeoJSON(coordinates) coordinates'),
      'type',
      'name',
    )
    .whereNotNull('coordinates')
    .where('status', '=', 'public')
    .orderBy('id');

  const pois = instances.map((instance) => ({
    type: 'Feature',
    properties: {
      id: instance.id,
      icon: instance.type.replace(' ', '_'),
      name: instance.name,
      type: instance.type,
    },
    geometry: instance.coordinates,
  }));

  fs.writeFileSync(
    path.resolve(DATA_DIR, 'pois.geojson'),
    JSON.stringify({
      type: 'FeatureCollection',
      features: pois,
    }),
    'utf-8'
  );

  logger.info('Done');
  endDuration(durationId);
}


async function createGeojsonTrips() {
  logger.info('Create geojson for trips');
  const durationId = startDuration();

  const instances = await models.Trip
    .query()
    .select(
      'id',
      knex.raw('ST_AsGeoJSON(path) path'),
      'activityType',
      'grading',
      'distance',
      'suitableForChildren',
      'name',
      'htgtPublicTransportAvailable',
      'htgtBoatTransportAvailable',
      'htgtCarAllYear',
      'htgtCarSummer',
      'htgtBicycle',
    )
    .whereNotNull('path')
    .where('status', '=', 'public')
    .orderBy('id');

  const trips = instances.map((instance) => ({
    type: 'Feature',
    properties: {
      id: instance.id,
      icon: `${instance.activityType.replace(' ', '_')}__${
        instance.grading.replace(' ', '_')}`,
      activity_type: instance.activityType,
      name: instance.name,
      type: instance.type,
      grading: instance.grading,
      htgt: {
        public_transport_available: instance.htgtPublicTransportAvailable,
        boat_transport_available: instance.htgtBoatTransportAvailable,
        car_all_year: instance.htgtCarAllYear,
        car_summer: instance.htgtCarSummer,
        bicycle: instance.htgtCarBicycle,
      },
    },
    geometry: instance.path,
  }));

  fs.writeFileSync(
    path.resolve(DATA_DIR, 'trips.geojson'),
    JSON.stringify({
      type: 'FeatureCollection',
      features: trips,
    }),
    'utf-8'
  );

  logger.info('Done');
  endDuration(durationId);
}


async function createGeojsonRoutes(type) {
  logger.info(`Create geojson for routes (${type})`);
  const durationId = startDuration();

  const instances = await models.RouteSegment
    .query()
    .select(
      'id',
      knex.raw('ST_AsGeoJSON(path) path'),
      'calculatedDistance',
    )
    .eager('routes(routesFilter)', {
      routesFilter: (builder) => {
        builder.select('id', 'name', 'calculatedDistance');
      },
    })
    .whereNotNull('path')
    .where('type', '=', type)
    .orderBy('id');

  const routes = instances.map((instance) => ({
    type: 'Feature',
    properties: {
      id: instance.id,
      type,
      calculated_distance: instance.calculatedDistance,
      routes: (instance.routes || []).map((r) => ({
        id: r.id,
        calculated_distance: r.calculatedDistance,
        name: r.name,
      })),
    },
    geometry: instance.path,
  }));

  fs.writeFileSync(
    path.resolve(DATA_DIR, `routes${type}.geojson`),
    JSON.stringify({
      type: 'FeatureCollection',
      features: routes,
    }),
    'utf-8'
  );

  logger.info('Done');
  endDuration(durationId);
}


async function createGeojsonRoutePoints(type) {
  logger.info(`Create geojson for route points (${type})`);
  const durationId = startDuration();

  const instances = await models.RouteSegment
    .query()
    .select(
      'id',
      knex.raw('ST_AsGeoJSON(point_a) point_a'),
    )
    .whereNotNull('path')
    .where('type', '=', type)
    .orderBy('id');

  const points = instances.map((instance) => ({
    type: 'Feature',
    properties: {
      id: instance.id,
      type,
    },
    geometry: instance.pointA,
  }));

  fs.writeFileSync(
    path.resolve(DATA_DIR, `routes${type}points.geojson`),
    JSON.stringify({
      type: 'FeatureCollection',
      features: points,
    }),
    'utf-8'
  );

  logger.info('Done');
  endDuration(durationId);
}


async function tippecanoe(name) {
  logger.info(`Tippecanoe: ${name}`);
  const durationId = startDuration();

  spawnSync(
    'tippecanoe',
    TIPPECANOE_OPTIONS[name],
    SPAWN_SYNC_OPTIONS
  );

  endDuration(durationId);
}


async function joinTiles() {
  logger.info('Join tiles');
  const durationId = startDuration();

  try {
    fs.unlinkSync(path.resolve(DATA_DIR, 'with-tilestats.mbtiles'));
  }
  catch (error) {
    // Ignore missing file
  }

  const status = spawnSync('tile-join', [
    '-o',
    path.resolve(DATA_DIR, 'with-tilestats.mbtiles'),
    path.resolve(DATA_DIR, 'cabins.mbtiles'),
    path.resolve(DATA_DIR, 'pois.mbtiles'),
    path.resolve(DATA_DIR, 'trips.mbtiles'),
    path.resolve(DATA_DIR, 'routes.mbtiles'),
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

  endDuration(durationId);
  return error;
}


async function main() {
  // await createGeojsonCabins();
  // await createGeojsonPois();
  // await createGeojsonTrips();
  // await createGeojsonRoutes('ski');
  // await createGeojsonRoutes('foot');
  // await createGeojsonRoutePoints('ski');
  // await createGeojsonRoutePoints('foot');

  // // eslint-disable-next-line
  // for (let name of Object.keys(TIPPECANOE_OPTIONS)) {
  //   // eslint-disable-next-line
  //   await tippecanoe(name);
  // }

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

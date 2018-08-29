import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

import eventStream from 'event-stream';
import JSONStream from 'JSONStream';
import clustersDbscan from '@turf/clusters-dbscan';
import { clusterEach } from '@turf/clusters';
import center from '@turf/center';

import {
  createLogger,
  startDuration,
  endDuration,
} from '@turistforeningen/ntb-shared-utils';
import { knex, Knex } from '@turistforeningen/ntb-shared-db-utils';
import * as models from '@turistforeningen/ntb-shared-models';
import settings from '@turistforeningen/ntb-shared-settings';


// Bump this if you change or delete properties (not if you only add new ones)
const VERSION = '1';

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
    path.resolve(DATA_DIR, `cabins-v${VERSION}.mbtiles`),
    '-f',
    '-B',
    7,
    '-r2',
    '--generate-ids',
    path.resolve(DATA_DIR, 'cabins.geojson'),
  ],
  trips: [
    '-o',
    path.resolve(DATA_DIR, `trips-v${VERSION}.mbtiles`),
    '-f',
    '-B',
    7,
    '-r2',
    '--generate-ids',
    path.resolve(DATA_DIR, 'trips.geojson'),
  ],
  pois: [
    '-o',
    path.resolve(DATA_DIR, `pois-v${VERSION}.mbtiles`),
    '-f',
    '-B',
    7,
    '-r2',
    '--generate-ids',
    path.resolve(DATA_DIR, 'pois.geojson'),
  ],
  routes: [
    '-o',
    path.resolve(DATA_DIR, `routes-v${VERSION}.mbtiles`),
    '-f',
    '-B',
    8,
    '--generate-ids',
    path.resolve(DATA_DIR, 'routesfoot.geojson'),
    path.resolve(DATA_DIR, 'routesfootpoints.geojson'),
    path.resolve(DATA_DIR, 'routesski.geojson'),
    path.resolve(DATA_DIR, 'routesskipoints.geojson'),
  ],
};


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
    .whereNotNull('serviceLevel')
    .where('status', '=', 'public')
    .where('provider', '=', 'DNT')
    .orderBy('id');

  const cabins = instances.map((instance) => {
    const cabin = {
      type: 'Feature',
      properties: {
        ntb_id: instance.id,
        icon: `${instance.dntCabin ? 'dnt' : 'private'}__${
          (instance.serviceLevel || 'unknown').replace(' ', '_')}`,
        name: instance.name.substr(0, 200),
        dnt_cabin: instance.dntCabin,
        service_level: instance.serviceLevel,
        ...(instance.accessabilities || [])
          .reduce((agg, cur) => {
            agg[`accessability__${cur.name.replace(' ', '_')}`] = true;
            return agg;
          }, {}),
        ...(instance.facilities || [])
          .reduce((agg, cur) => {
            agg[`facility__${cur.name.replace(' ', '_')}`] = true;
            return agg;
          }, {}),
      },
      geometry: instance.coordinates,
    };


    if (instance.htgtPublicTransportAvailable) {
      cabin.properties.htgt_public_transport_available = true;
    }

    if (instance.htgtBoatTransportAvailable) {
      cabin.properties.htgt_boat_transport_available = true;
    }

    if (instance.htgtCarAllYear) {
      cabin.properties.htgt_car_all_year = true;
    }

    if (instance.htgtCarSummer) {
      cabin.properties.htgt_car_summer = true;
    }

    if (instance.htgtCarBicycle) {
      cabin.properties.htgt_bicycle = true;
    }

    return cabin;
  });

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
    .eager('poiTypes')
    .whereNotNull('coordinates')
    .where('status', '=', 'public')
    .where('provider', '=', 'DNT')
    .orderBy('id');

  const pois = instances.map((instance) => ({
    type: 'Feature',
    properties: {
      ntb_id: instance.id,
      icon: instance.type.replace(' ', '_'),
      name: instance.name.substr(0, 200),
      ...(instance.poiTypes || [])
        .reduce((agg, cur) => {
          agg[`type__${cur.name.replace(' ', '_')}`] = true;
          return agg;
        }, {}),
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
      knex.raw('ST_AsGeoJSON(starting_point) point'),
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
    .eager('accessabilities')
    .whereNotNull('startingPoint')
    .where('status', '=', 'public')
    .where('provider', '=', 'DNT')
    .orderBy('id');

  const trips = instances.map((instance) => {
    const trip = {
      type: 'Feature',
      properties: {
        ntb_id: instance.id,
        icon: `${instance.activityType.replace(' ', '_')}__${
          instance.grading.replace(' ', '_')}`,
        activity_type: instance.activityType,
        name: instance.name.substr(0, 200),
        grading: instance.grading,
        ...(instance.accessabilities || [])
          .reduce((agg, cur) => {
            agg[`accessability__${cur.name.replace(' ', '_')}`] = true;
            return agg;
          }, {}),
      },
      geometry: JSON.parse(instance.point),
    };

    if (instance.htgtPublicTransportAvailable) {
      trip.properties.htgt_public_transport_available = true;
    }

    if (instance.htgtBoatTransportAvailable) {
      trip.properties.htgt_boat_transport_available = true;
    }

    if (instance.htgtCarAllYear) {
      trip.properties.htgt_car_all_year = true;
    }

    if (instance.htgtCarSummer) {
      trip.properties.htgt_car_summer = true;
    }

    if (instance.htgtCarBicycle) {
      trip.properties.htgt_bicycle = true;
    }

    return trip;
  });

  fs.writeFileSync(
    path.resolve(DATA_DIR, 'trips-all.geojson'),
    JSON.stringify({
      type: 'FeatureCollection',
      features: trips,
    }),
    'utf-8'
  );

  logger.info('Done');
  endDuration(durationId);
}


async function createGeojsonTripClusters() {
  logger.info('Creating trip clusters');
  const durationId = startDuration();

  const readStream = fs.createReadStream(
    path.resolve(DATA_DIR, 'trips-all.geojson'),
  );
  const features = [];
  const maxDistance = 25; // meters

  readStream.on('end', () => {
    const collection = { type: 'FeatureCollection', features };
    let numClusters = 0;

    logger.info(`- Number of features: ${features.length}`);

    // http://turfjs.org/docs#clustersDbscan
    clustersDbscan(
      collection,
      maxDistance / 1000,
      { mutate: true, minPoints: 2 }
    );

    clusterEach(collection, 'cluster', (cluster, clusterValue) => {
      const count = cluster.features.length;
      const { geometry } = center(cluster);

      cluster.features.forEach((feature) => {
        feature.properties.cluster = clusterValue;
        feature.properties.count = count;
        feature.geometry = geometry;
      });

      numClusters += 1;
    });

    logger.info(`- Number of clustered features: ${numClusters}`);

    features.forEach((feature) => {
      if (!feature.properties.count) {
        delete feature.properties.cluster;
      }
      delete feature.properties.dbscan;
    });

    fs.writeFile(
      path.resolve(DATA_DIR, 'trips.geojson'),
      JSON.stringify(collection),
      (err) => {
        if (err) throw err;
        logger.info('Trip clusters saved');
      }
    );
  });

  await readStream
    .pipe(JSONStream.parse('features.*'))
    .pipe(eventStream.mapSync((trip) => features.push(trip)));

  logger.info('Trip clusters done');
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
    .whereNotNull('path')
    .where('type', '=', type)
    .where('calculatedDistance', '>', 0)
    .orderBy('id');

  const routes = instances.map((instance) => ({
    type: 'Feature',
    properties: {
      ntb_id: instance.id,
      calculated_distance_km: Math.round(instance.calculatedDistance / 1000),
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
    id: instance.id,
    properties: {
      type,
    },
    geometry: JSON.parse(instance.pointA),
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
    fs.unlinkSync(path.resolve(DATA_DIR, 'ntb.mbtiles'));
  }
  catch (error) {
    // Ignore missing file
  }

  spawnSync('tile-join', [
    '-o',
    path.resolve(DATA_DIR, 'ntb.mbtiles'),
    path.resolve(DATA_DIR, 'cabins.mbtiles'),
    path.resolve(DATA_DIR, 'pois.mbtiles'),
    path.resolve(DATA_DIR, 'routes.mbtiles'),
    path.resolve(DATA_DIR, 'trips.mbtiles'),
  ]);

  endDuration(durationId);
}


async function fixMbtilesName() {
  logger.info('Doing a fix on the mbtiles-internal name');
  const durationId = startDuration();

  // eslint-disable-next-line
  const sqliteKnex = Knex({
    client: 'sqlite3',
    connection: {
      filename: path.resolve(DATA_DIR, 'ntb.mbtiles'),
    },
    useNullAsDefault: true,
  });

  await sqliteKnex.raw(`
    UPDATE metadata SET value='NTB - v${VERSION}' WHERE name='name';
  `);

  await sqliteKnex.raw(`
    UPDATE metadata SET value='Mapbox tiles from NTB - nasjonalturbase.no'
    WHERE name='description';
  `);

  endDuration(durationId);
}


async function uploadToMapbox() {
  if (!settings.MAPBOX_TOKEN) {
    logger.info('Mapbox token is not set - no upload will be executed');
  }

  logger.info('Uploading to mapbox');
  const durationId = startDuration();

  const status = spawnSync('mapbox', [
    '--access-token',
    settings.MAPBOX_TOKEN,
    'upload',
    '--name',
    `NTB - v${VERSION}`,
    `turistforeningen.ntb-v${VERSION}`,
    path.resolve(DATA_DIR, 'ntb.mbtiles'),
  ]);

  logger.info('mapbox output start:');
  status.output.filter((o) => o).forEach((o) => {
    logger.info(o);
  });
  logger.info('mapbox output end');

  endDuration(durationId);
}


async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }

  await createGeojsonCabins();
  await createGeojsonPois();
  await createGeojsonTrips();
  await createGeojsonTripClusters();
  await createGeojsonRoutes('ski');
  await createGeojsonRoutes('foot');
  await createGeojsonRoutePoints('ski');
  await createGeojsonRoutePoints('foot');

  // eslint-disable-next-line
  for (let name of Object.keys(TIPPECANOE_OPTIONS)) {
    // eslint-disable-next-line
    await tippecanoe(name);
  }

  await joinTiles();
  await fixMbtilesName();
  await uploadToMapbox();
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

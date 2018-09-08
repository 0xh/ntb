import { createLogger } from '@ntb/utils';


const logger = createLogger();


const TABLES = {
  pictures: {
    coordinates: 'GEOMETRY(Point, 25833)',
  },
  lists: {
    coordinates: 'GEOMETRY(MultiPoint, 25833)',
  },
  route_segments: {
    path: 'GEOMETRY(LineString, 25833)',
    point_a: 'GEOMETRY(Point, 25833)',
    point_b: 'GEOMETRY(Point, 25833)',
  },
  routes_wfs_data_ski: {
    wkb_geometry: 'GEOMETRY(LineString, 25833)',
  },
  routes_wfs_data_bike: {
    wkb_geometry: 'GEOMETRY(LineString, 25833)',
  },
  routes_wfs_data_other: {
    wkb_geometry: 'GEOMETRY(LineString, 25833)',
  },
  routes_wfs_data_foot: {
    wkb_geometry: 'GEOMETRY(LineString, 25833)',
  },
  counties_municipalities_wfs_data: {
    wkb_geometry: 'GEOMETRY(MultiPolygon, 25833)',
  },
  areas: {
    geometry: 'GEOMETRY(Polygon, 25833)',
  },
  cabins: {
    coordinates: 'GEOMETRY(Point, 25833)',
  },
  counties: {
    geometry: 'GEOMETRY(MultiPolygon, 25833)',
  },
  municipalities: {
    geometry: 'GEOMETRY(MultiPolygon, 25833)',
  },
  hazard_regions: {
    geometry: 'GEOMETRY(Polygon, 25833)',
  },
  pois: {
    coordinates: 'GEOMETRY(Point, 25833)',
  },
  trips: {
    starting_point: 'GEOMETRY(Point, 25833)',
    path: 'GEOMETRY(LineString, 25833)',
  },
};

const INDEXES = {
  routes_wfs_data_ski_wkb_geometry: 'routeswfsdataski_wkbgeometry_index',
  routes_wfs_data_bike_wkb_geometry: 'routeswfsdatabike_wkbgeometry_index',
  routes_wfs_data_foot_wkb_geometry: 'routeswfsdatafoot_wkbgeometry_index',
  routes_wfs_data_other_wkb_geometry: 'routeswfsdataother_wkbgeometry_index',
  counties_municipalities_wfs_data_wkb_geometry:
    'counties_municipalities_wfs_data_wkb_geometry_geom_idx',
  hazard_regions_geometry: 'hazardregions_geometry_index',
};


export async function up(knex) {
  // eslint-disable-next-line
  for (const tableName of Object.keys(TABLES)) {
    logger.info(`Processing table ${tableName}`);
    const options = TABLES[tableName];

    // eslint-disable-next-line
    for (const column of Object.keys(options)) {
      logger.info(`- Processing column ${column}`);
      const type = options[column];
      const indexName = INDEXES[`${tableName}_${column}`]
        ? INDEXES[`${tableName}_${column}`]
        : `${tableName}_${column}_index`;

      // eslint-disable-next-line
      await knex.raw(`
        ALTER TABLE ${tableName}
        ALTER COLUMN ${column}
        TYPE ${type}
        USING ST_Transform(${column}, 25833)
      `);

      logger.info(`- Processing index ${indexName}`);
      // eslint-disable-next-line
      await knex.raw(`REINDEX INDEX ${indexName}`);
    }
  }

  logger.info('Process routes.path');
  await knex.raw(`
    SELECT updategeometrysrid('public', 'routes', 'path', 25833)
  `);
  await knex.raw(`
    UPDATE routes SET path = ST_Transform(path, 25833)
  `);
  await knex.raw('REINDEX INDEX routes_path_index');

  logger.info('Process routes.path_buffer');
  await knex.raw(`
    SELECT updategeometrysrid('public', 'routes', 'path_buffer', 25833)
  `);
  await knex.raw(`
    UPDATE routes SET path_buffer = ST_Transform(path_buffer, 25833)
  `);
  await knex.raw('REINDEX INDEX routes_pathbuffer_index');

  logger.info('Process trips.path_buffer');
  await knex.raw(`
    SELECT updategeometrysrid('public', 'trips', 'path_buffer', 25833)
  `);
  await knex.raw(`
    UPDATE trips SET path_buffer = ST_Transform(path_buffer, 25833)
  `);
  await knex.raw('REINDEX INDEX trips_pathbuffer_index');
}


export async function down(knex) {
  return true;
}

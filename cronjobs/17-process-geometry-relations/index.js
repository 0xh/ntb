import {
  createLogger,
  startDuration,
  endDuration,
} from '@turistforeningen/ntb-shared-utils';
import { knex } from '@turistforeningen/ntb-shared-db-utils';


const logger = createLogger();

const MAX_DISTANCE = 5000;
const LIMIT = 100;

const DOCUMENT_TABLES = {
  areas: { geomField: 'geometry' },
  cabins: { geomField: 'coordinates' },
  counties: { geomField: 'geometry', singular: 'county' },
  hazard_regions: { geomField: 'geometry' },
  municipalities: { geomField: 'geometry', singular: 'municipality' },
  pois: { geomField: 'coordinates' },
  routes: { geomField: 'path', bufferField: 'path_buffer' },
  trips: { geomField: 'path', bufferField: 'path_buffer' },
};

const RELATION_TABLES = [
  'cabins_to_areas',
  'areas_to_counties',
  'areas_to_hazard_regions',
  'areas_to_municipalities',
  'pois_to_areas',
  'routes_to_areas',
  'trips_to_areas',
  'cabins_to_trips_by_distance',
  'cabins_to_cabins_by_distance',
  'cabins_to_hazard_regions',
  'cabins_to_pois_by_distance',
  'routes_to_cabins_by_distance',
  'counties_to_hazard_regions',
  'routes_to_counties',
  'trips_to_counties',
  'municipalities_to_hazard_regions',
  'pois_to_hazard_regions',
  'routes_to_hazard_regions',
  'trips_to_hazard_regions',
  'routes_to_municipalities',
  'trips_to_municipalities',
  'pois_to_pois_by_distance',
  'routes_to_pois_by_distance',
  'trips_to_pois_by_distance',
  // 'routes_to_trips_by_distance', // Fixed in it's own function
  // 'routes_to_routes_by_distance', // Fixed in it's own function
  // 'trips_to_trips_by_distance', // Fixed in it's own function
];


const TABLE_IDS = {

};

async function getIds() {
  // eslint-disable-next-line
  for (let table of Object.keys(DOCUMENT_TABLES)) {
    logger.info(`Getting IDs for ${table}`);
    const { geomField, bufferField } = DOCUMENT_TABLES[table];

    // eslint-disable-next-line
    const result = await knex.raw(`
      SELECT
        id
      FROM ${table}
      WHERE
        (
          processed_relations_updated_at IS NULL
          OR ${geomField}_updated_at > processed_relations_updated_at
        )
        AND ${bufferField || geomField} IS NOT NULL
      ORDER BY
        id ASC
      LIMIT ${LIMIT}
    `);

    TABLE_IDS[table] = result.rows.map((row) => row.id);
    logger.info(`- Found ${result.rowCount} rows`);
  }
}


async function processRelation(relationTable) {
  const byDistance = relationTable.endsWith('_by_distance');
  const [tableA, tableB] = relationTable
    .replace('_by_distance', '')
    .split('_to_');
  const selfReference = tableA === tableB;

  // eslint-disable-next-line
  for (const reversed of [false, true]) {
    const tblA = reversed ? tableB : tableA;
    const tblB = reversed ? tableA : tableB;
    const selfA = reversed ? '_b' : '_a';
    const selfB = reversed ? '_a' : '_b';
    const { singular: singularA } = DOCUMENT_TABLES[tblA];
    const { singular: singularB } = DOCUMENT_TABLES[tblB];

    const ids = TABLE_IDS[tblA];
    const { geomField: geomA, bufferField: bufferFieldA } =
      DOCUMENT_TABLES[tblA];
    const { geomField: geomB, bufferField: bufferFieldB } =
      DOCUMENT_TABLES[tblB];
    const distance = relationTable === 'routes_to_trips_by_distance'
      ? ',0'
      : `,ST_Distance(a.${geomA}::GEOGRAPHY, b.${geomB}::GEOGRAPHY)::INTEGER`;

    let geometryClause = `
      ST_Intersects(
        a.${bufferFieldA || geomA},
        b.${bufferFieldB || geomB}
      ) IS TRUE
    `;
    if (byDistance && !bufferFieldA) {
      geometryClause = `
        ST_DWithin(
          a.${geomA},
          b.${geomB},
          ${MAX_DISTANCE},
          true
        ) IS TRUE
      `;
    }

    if (ids && ids.length) {
      logger.info(`Prossesing relations for ${tblA} to ${tblB}`);
      // eslint-disable-next-line
      await knex.raw(`
        INSERT INTO ${relationTable} (
          ${singularA || tblA.slice(0, -1)}${selfReference ? selfA : ''}_id,
          ${singularB || tblB.slice(0, -1)}${selfReference ? selfB : ''}_id
          ${byDistance ? ',calculated_distance' : ''}
        )
        SELECT
          a.id aid,
          b.id bid
          ${byDistance ? distance : ''}
        FROM ${tblA} a
        INNER JOIN ${tblB} b ON
          ${geometryClause}
          ${selfReference ? 'AND b.id <> a.id' : ''}
        WHERE
          a.id = ANY(:ids)
        ORDER BY
          a.id
        ON CONFLICT DO NOTHING
      `, { ids });
    }
  }
}


async function processRoutesToTrips() {
  if (TABLE_IDS.trips && TABLE_IDS.trips.length) {
    logger.info('Processing relations for routes to trips');

    await knex.raw(`
      INSERT INTO routes_to_trips_by_distance (
        trip_id,
        route_id,
        calculated_distance
      )
      SELECT
        t.id trip_id,
        r.id route_id,
        LEAST(
          MIN(ST_Distance(t.path::GEOGRAPHY, rs.point_a::GEOGRAPHY)::INTEGER),
          MIN(ST_Distance(t.path::GEOGRAPHY, rs.point_b::GEOGRAPHY)::INTEGER)
        ) calculated_distance
      FROM (
        SELECT
          id,
          path_buffer,
          path
        FROM trips
        WHERE
          id = ANY(:ids)
      ) t
      INNER JOIN route_segments rs ON
        ST_Intersects(t.path_buffer, rs.point_a) IS TRUE
        OR ST_Intersects(t.path_buffer, rs.point_b) IS TRUE
      INNER JOIN routes_to_route_segments rtrs ON
        rtrs.route_segment_id = rs.id
      INNER JOIN routes r ON
        r.id = rtrs.route_id
      GROUP BY
        t.id,
        r.id
      ON CONFLICT DO NOTHING
    `, { ids: TABLE_IDS.trips });
  }
}


async function processTripsToRoutes() {
  if (TABLE_IDS.routes && TABLE_IDS.routes.length) {
    logger.info('Processing relations for routes to trips');

    await knex.raw(`
      INSERT INTO routes_to_trips_by_distance (
        trip_id,
        route_id,
        calculated_distance
      )
      SELECT
        t.id trip_id,
        r.id route_id,
        LEAST(
          MIN(ST_Distance(t.path::GEOGRAPHY, rs.point_a::GEOGRAPHY)::INTEGER),
          MIN(ST_Distance(t.path::GEOGRAPHY, rs.point_b::GEOGRAPHY)::INTEGER)
        ) calculated_distance
      FROM (
        SELECT
          route_segments.id,
          point_a,
          point_b
        FROM route_segments
        INNER JOIN routes_to_route_segments ON
          routes_to_route_segments.route_segment_id = route_segments.id
        INNER JOIN routes ON
          routes.id = ANY(:ids)
          AND routes_to_route_segments.route_id = routes.id
      ) rs
      INNER JOIN trips t ON
        ST_Intersects(t.path_buffer, rs.point_a) IS TRUE
        OR ST_Intersects(t.path_buffer, rs.point_b) IS TRUE
      INNER JOIN routes_to_route_segments rtrs ON
        rtrs.route_segment_id = rs.id
      INNER JOIN routes r ON
        r.id = rtrs.route_id
      GROUP BY
        t.id,
        r.id
      ON CONFLICT DO NOTHING
    `, { ids: TABLE_IDS.routes });
  }
}


async function processRoutesToRoutes() {
  if (TABLE_IDS.routes && TABLE_IDS.routes.length) {
    logger.info('Processing relations for routes to routes');

    await knex.raw(`
      INSERT INTO routes_to_routes_by_distance (
        route_a_id,
        route_b_id,
        calculated_distance
      )
      SELECT
        r.id route_a_id,
        r2.id route_b_id,
        LEAST(
          MIN(
            ST_Distance(rs.point_a::GEOGRAPHY, rs2.point_a::GEOGRAPHY)::INTEGER
          ),
          MIN(
            ST_Distance(rs.point_a::GEOGRAPHY, rs2.point_b::GEOGRAPHY)::INTEGER
          ),
          MIN(
            ST_Distance(rs.point_b::GEOGRAPHY, rs2.point_a::GEOGRAPHY)::INTEGER
          ),
          MIN(
            ST_Distance(rs.point_b::GEOGRAPHY, rs2.point_b::GEOGRAPHY)::INTEGER
          )
        ) calculated_distance
      FROM (
        SELECT
          route_segments.id,
          point_a,
          point_b
        FROM route_segments
        INNER JOIN routes_to_route_segments ON
          routes_to_route_segments.route_segment_id = route_segments.id
        INNER JOIN routes ON
          routes.id = ANY(:ids)
          AND routes_to_route_segments.route_id = routes.id
        LIMIT 1
      ) rs
      INNER JOIN route_segments rs2 ON
        rs2.id <> rs.id
        AND (
          ST_DWithin(rs2.point_a, rs.point_a, 5000, true) IS TRUE
          OR ST_DWithin(rs2.point_a, rs.point_b, 5000, true) IS TRUE
          OR ST_DWithin(rs2.point_b, rs.point_a, 5000, true) IS TRUE
          OR ST_DWithin(rs2.point_b, rs.point_b, 5000, true) IS TRUE
        )
      INNER JOIN routes_to_route_segments rtrs ON
        rtrs.route_segment_id = rs.id
      INNER JOIN routes r ON
        r.id = rtrs.route_id
      INNER JOIN routes_to_route_segments rtrs2 ON
        rtrs2.route_segment_id = rs2.id
      INNER JOIN routes r2 ON
        r2.id = rtrs2.route_id
        AND r2.id <> r.id
      GROUP BY
        r.id,
        r2.id
    `, { ids: TABLE_IDS.routes });
  }
}


async function processTripsToTrips() {
  if (TABLE_IDS.trips && TABLE_IDS.trips.length) {
    logger.info('Processing relations for trips to trips');

    await knex.raw(`
      INSERT INTO trips_to_trips_by_distance (
        trip_a_id,
        trip_b_id,
        calculated_distance
      )
      SELECT
        t.id trip_id,
        t2.id route_id,
        MIN(ST_Distance(t.path::GEOGRAPHY, t2.path::GEOGRAPHY)::INTEGER)
          calculated_distance
      FROM (
        SELECT
          id,
          path_buffer,
          path
        FROM trips
        WHERE
          id = ANY(:ids)
      ) t
      INNER JOIN trips t2 ON
        ST_Intersects(t.path_buffer, t2.path) IS TRUE
        AND t.id <> t2.id
      GROUP BY
        t.id,
        t2.id
    `, { ids: TABLE_IDS.trips });
  }
}


async function updateProccessedTimestamp() {
  // eslint-disable-next-line
  for (const table of Object.keys(DOCUMENT_TABLES)) {
    if (TABLE_IDS[table].length) {
      logger.info(`Updating processed_relations_updated_at for ${table}`);
      // eslint-disable-next-line
      await knex.raw(`
        UPDATE ${table} SET processed_relations_updated_at = NOW()
        WHERE id = ANY(:ids)
      `, { ids: TABLE_IDS[table] });
    }
  }
}


async function main() {
  const durationId = startDuration();
  await getIds();

  // eslint-disable-next-line
  for (const relationTable of RELATION_TABLES) {
    // eslint-disable-next-line
    await processRelation(relationTable);
  }

  await processRoutesToTrips();
  await processTripsToRoutes();
  await processRoutesToRoutes();
  await processTripsToTrips();
  await updateProccessedTimestamp();

  logger.info('ALL DONE');
  endDuration(durationId);
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

import moment from 'moment';

import { createLogger } from '@turistforeningen/ntb-shared-utils';
import { knex } from '@turistforeningen/ntb-shared-db-utils';


// TODO(Roar)
// -


const logger = createLogger();

const MAX_DISTANCE = 5000;
const TYPES = [
  // CABINS TO POIS
  {
    mainTable: 'pois',
    mainAttribute: 'coordinates',
    mainStatusAttribute: 'processed_near_cabins',
    joinTable: 'cabins',
    joinAttribute: 'coordinates',
    throughTable: 'cabins_to_pois_by_distance',
    throughMainAttribute: 'poi_id',
    throughJoinAttribute: 'cabin_id',
    limit: 1000,
  },
  // CABINS TO TRIPS
  {
    mainTable: 'trips',
    mainAttribute: 'path',
    mainStatusAttribute: 'processed_near_cabins',
    joinTable: 'cabins',
    joinAttribute: 'coordinates',
    throughTable: 'cabins_to_trips_by_distance',
    throughMainAttribute: 'trip_id',
    throughJoinAttribute: 'cabin_id',
    limit: 100,
  },
  // ROUTE_SEGMENT TO POIS
  {
    mainTable: 'route_segments',
    mainAttribute: 'path',
    mainStatusAttribute: 'processed_near_pois',
    joinTable: 'pois',
    joinAttribute: 'coordinates',
    throughTable: 'route_segments_to_pois_by_distance',
    throughMainAttribute: 'route_segment_id',
    throughJoinAttribute: 'poi_id',
    limit: 100,
  },
  // ROUTE_SEGMENT TO TRIPS
  // {
  //   mainTable: 'route_segments',
  //   mainAttribute: 'path',
  //   mainStatusAttribute: 'processed_near_trips',
  //   joinTable: 'trips',
  //   joinAttribute: 'path',
  //   throughTable: 'route_segments_to_trips_by_distance',
  //   throughMainAttribute: 'route_segment_id',
  //   throughJoinAttribute: 'trip_id',
  //   limit: 100,
  // },
  // ROUTE_SEGMENTS TO CABINS
  {
    mainTable: 'route_segments',
    mainAttribute: 'path',
    mainStatusAttribute: 'processed_near_cabins',
    joinTable: 'cabins',
    joinAttribute: 'coordinates',
    throughTable: 'route_segments_to_cabins_by_distance',
    throughMainAttribute: 'route_segment_id',
    throughJoinAttribute: 'cabin_id',
    limit: 100,
  },
  // TRIPS TO POIS
  {
    mainTable: 'trips',
    mainAttribute: 'path',
    mainStatusAttribute: 'processed_near_pois',
    joinTable: 'pois',
    joinAttribute: 'coordinates',
    throughTable: 'trips_to_pois_by_distance',
    throughMainAttribute: 'trip_id',
    throughJoinAttribute: 'poi_id',
    limit: 100,
  },
];


async function createTempTable(idx) {
  const timeStamp = moment().format('YYYYMMDDHHmmssSSS');
  const tableName = `0_${timeStamp}_intersect_${idx}`;

  logger.info(`[${idx}] Creating temp table: ${tableName}`);

  await knex.schema.createTable(tableName, (table) => {
    table.uuid('mainId');
    table.uuid('joinId');
    table.integer('calculated_distance');
  });

  return tableName;
}


async function populateTempTable(idx, type, tableName) {
  logger.info(`[${idx}] Populating temp table`);

  await knex.raw(`
    INSERT INTO "${tableName}" (
      main_id,
      join_id,
      calculated_distance
    )
    SELECT
      m.id,
      j.id,
      st_distance_sphere(m.geom, j."${type.joinAttribute}")::INTEGER
    FROM (
      SELECT
        "inner".id,
        "inner"."${type.mainAttribute}" geom
      FROM "${type.mainTable}" "inner"
      WHERE
        "inner"."${type.mainAttribute}" IS NOT NULL
        AND "inner"."${type.mainStatusAttribute}" IS FALSE
      ORDER BY
        "inner".id
      LIMIT ${type.limit}
    ) m
    LEFT JOIN "${type.joinTable}" j ON
      j."${type.joinAttribute}" IS NOT NULL
      AND st_dwithin(
        m.geom,
        j."${type.joinAttribute}",
        ${MAX_DISTANCE},
        true
      )
  `);
}


async function populateThroughTable(idx, type, tableName) {
  logger.info(`[${idx}] Updating through table`);

  await knex.raw(`
    INSERT INTO "${type.throughTable}" (
      "${type.throughMainAttribute}",
      "${type.throughJoinAttribute}",
      calculated_distance,
      created_at,
      updated_at
    )
    SELECT
      t.main_id,
      t.join_id,
      t.calculated_distance,
      now(),
      now()
    FROM "${tableName}" t
    WHERE
      t.join_id IS NOT NULL
    ON CONFLICT (
      "${type.throughMainAttribute}",
      "${type.throughJoinAttribute}"
    ) DO UPDATE SET
      updated_at = EXCLUDED.updated_at,
      calculated_distance = EXCLUDED.calculated_distance
  `);
}


async function deleteDeprecatedInThroughTable(idx, type, tableName) {
  logger.info(`[${idx}] Deleting deprecated in through table`);

  await knex.raw(`
    DELETE FROM "${type.throughTable}"
    USING "${type.throughTable}" c
    INNER JOIN (SELECT DISTINCT main_id FROM "${tableName}") x ON
      c."${type.throughMainAttribute}" = x.main_id
    LEFT JOIN "${tableName}" t ON
      c."${type.throughMainAttribute}" = t.main_id
      AND c."${type.throughJoinAttribute}" = t.join_id
    WHERE
      t.join_id IS NULL
      AND public."${type.throughTable}"."${type.throughMainAttribute}" =
        c."${type.throughMainAttribute}"
      AND public."${type.throughTable}"."${type.throughJoinAttribute}" =
        c."${type.throughJoinAttribute}"
  `);
}


async function tagMainRecordsAsProcessed(idx, type, tableName) {
  logger.info(`[${idx}] Tagging main records as processed`);

  await knex.raw(`
    UPDATE "${type.mainTable}" SET "${type.mainStatusAttribute}" = true
    WHERE id IN (
      SELECT DISTINCT main_id FROM "${tableName}"
    )
  `);
}


async function deleteTempTable(idx, tableName) {
  logger.info(`[${idx}] Deleting temp table`);
  await knex.schema.dropTableIfExists(tableName);
}


async function aggregateRouteRelations(type) {
  logger.info(`Updating route to ${type}s relations`);

  await knex.raw(`
    INSERT INTO routes_to_${type}s_by_distance (
      route_id,
      ${type}_id,
      calculated_distance
    )
    SELECT DISTINCT
      r.id,
      rsthr.${type}_id,
      rsthr.calculated_distance
    FROM routes r
    INNER JOIN routes_to_route_segments rtrs ON
      rtrs.route_id = r.id
    INNER JOIN route_segments rs ON
      rs.id = rtrs.route_segment_id
    INNER JOIN route_segments_to_${type}s_by_distance rsthr ON
      rsthr.route_segment_id = rs.id
    ON CONFLICT (route_id, ${type}_id) DO NOTHING
  `);

  await knex.raw(`
    DELETE FROM routes_to_${type}s_by_distance
    USING routes_to_${type}s_by_distance t
    LEFT JOIN (
      SELECT DISTINCT
        r.id route_id,
        rsthr.${type}_id ${type}_id
      FROM routes r
      INNER JOIN routes_to_route_segments rtrs ON
        rtrs.route_id = r.id
      INNER JOIN route_segments rs ON
        rs.id = rtrs.route_segment_id
      INNER JOIN route_segments_to_${type}s_by_distance rsthr ON
        rsthr.route_segment_id = rs.id
    ) x ON
      t.route_id = x.route_id
      AND t.${type}_id = x.${type}_id
    WHERE
      t.route_id IS NULL
      AND t.route_id = public.routes_to_${type}s_by_distance.route_id
      AND t.${type}_id = public.routes_to_${type}s_by_distance.${type}_id
  `);
}


async function processType(idx, type) {
  logger.info(`[${idx}] Processing`);

  const tableName = await createTempTable(idx);
  await populateTempTable(idx, type, tableName);
  await populateThroughTable(idx, type, tableName);
  await deleteDeprecatedInThroughTable(idx, type, tableName);
  await tagMainRecordsAsProcessed(idx, type, tableName);
  await deleteTempTable(idx, tableName);
}


async function main() {
  // eslint-disable-next-line
  for (let [idx, type] of TYPES.entries()) {
    // eslint-disable-next-line
    await processType(idx, type);
  }

  const promises = ['poi', 'cabin']
    .map((type) => aggregateRouteRelations(type));
  await Promise.all(promises);
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

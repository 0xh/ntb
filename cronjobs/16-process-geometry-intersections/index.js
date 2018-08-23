import moment from 'moment';

import { createLogger } from '@turistforeningen/ntb-shared-utils';
import { knex } from '@turistforeningen/ntb-shared-db-utils';


// TODO(Roar)
// - Missing relations to Area
//   - RouteSegment
//   - Route
//   - Trip
// - Missing relations to Counties
//   - Cabin
//   - RouteSegment
//   - Route
//   - Trip
//   - Poi
// - Missing relations to Municipalities
//   - Cabin
//   - RouteSegment
//   - Route
//   - Trip
//   - Poi


const logger = createLogger();

const LIMIT = 2000;
const TYPES = [
  // TO HAZARD-REGIONS
  {
    mainTable: 'cabins',
    mainAttribute: 'coordinates',
    mainStatusAttribute: 'processed_hazard_regions',
    joinTable: 'hazard_regions',
    joinAttribute: 'geometry',
    throughTable: 'cabins_to_hazard_regions',
    throughMainAttribute: 'cabin_id',
    throughJoinAttribute: 'hazard_region_id',
  },
  {
    mainTable: 'route_segments',
    mainAttribute: 'path',
    mainStatusAttribute: 'processed_hazard_regions',
    joinTable: 'hazard_regions',
    joinAttribute: 'geometry',
    throughTable: 'route_segments_to_hazard_regions',
    throughMainAttribute: 'route_segment_id',
    throughJoinAttribute: 'hazard_region_id',
  },
  {
    mainTable: 'trips',
    mainAttribute: 'path',
    mainStatusAttribute: 'processed_hazard_regions',
    joinTable: 'hazard_regions',
    joinAttribute: 'geometry',
    throughTable: 'trips_to_hazard_regions',
    throughMainAttribute: 'trip_id',
    throughJoinAttribute: 'hazard_region_id',
  },
  {
    mainTable: 'pois',
    mainAttribute: 'coordinates',
    mainStatusAttribute: 'processed_hazard_regions',
    joinTable: 'hazard_regions',
    joinAttribute: 'geometry',
    throughTable: 'pois_to_hazard_regions',
    throughMainAttribute: 'poi_id',
    throughJoinAttribute: 'hazard_region_id',
  },

  // TO AREAS
  {
    mainTable: 'cabins',
    mainAttribute: 'coordinates',
    mainStatusAttribute: 'processed_areas',
    joinTable: 'areas',
    joinAttribute: 'geometry',
    throughTable: 'cabins_to_areas',
    throughMainAttribute: 'cabin_id',
    throughJoinAttribute: 'area_id',
  },
  {
    mainTable: 'pois',
    mainAttribute: 'coordinates',
    mainStatusAttribute: 'processed_areas',
    joinTable: 'areas',
    joinAttribute: 'geometry',
    throughTable: 'pois_to_areas',
    throughMainAttribute: 'poi_id',
    throughJoinAttribute: 'area_id',
  },

  // TO COUNTIES
  {
    mainTable: 'areas',
    mainAttribute: 'geometry',
    mainStatusAttribute: 'processed_counties',
    joinTable: 'counties',
    joinAttribute: 'geometry',
    throughTable: 'areas_to_counties',
    throughMainAttribute: 'area_id',
    throughJoinAttribute: 'county_id',
  },

  // TO MUNICIPALITIES
  {
    mainTable: 'areas',
    mainAttribute: 'geometry',
    mainStatusAttribute: 'processed_municipalities',
    joinTable: 'municipalities',
    joinAttribute: 'geometry',
    throughTable: 'areas_to_municipalities',
    throughMainAttribute: 'area_id',
    throughJoinAttribute: 'municipality_id',
  },
];


async function createTempTable(idx) {
  const timeStamp = moment().format('YYYYMMDDHHmmssSSS');
  const tableName = `0_${timeStamp}_intersect_${idx}`;

  logger.info(`[${idx}] Creating temp table: ${tableName}`);

  await knex.schema.createTable(tableName, (table) => {
    table.uuid('mainId');
    table.uuid('joinId');
  });

  return tableName;
}


async function populateTempTable(idx, type, tableName) {
  logger.info(`[${idx}] Populating temp table`);

  await knex.raw(`
    INSERT INTO "${tableName}" (
      main_id,
      join_id
    )
    SELECT
      m.id,
      j.id
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
      LIMIT ${LIMIT}
    ) m
    LEFT JOIN "${type.joinTable}" j ON
      st_intersects(j."${type.joinAttribute}", m."geom")
    ORDER BY
      m.id
  `);
}


async function populateThroughTable(idx, type, tableName) {
  logger.info(`[${idx}] Updating through table`);

  await knex.raw(`
    INSERT INTO "${type.throughTable}" (
      "${type.throughMainAttribute}",
      "${type.throughJoinAttribute}",
      created_at,
      updated_at
    )
    SELECT
      t.main_id,
      t.join_id,
      now(),
      now()
    FROM "${tableName}" t
    WHERE
      t.join_id IS NOT NULL
    ON CONFLICT (
      "${type.throughMainAttribute}",
      "${type.throughJoinAttribute}"
    ) DO UPDATE SET
      updated_at = EXCLUDED.updated_at
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
  const promises = TYPES.map((type, idx) => processType(idx, type));
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

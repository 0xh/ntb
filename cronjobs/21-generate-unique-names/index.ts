import {
  _,
  Logger,
  startDuration,
  printDuration,
  moment,
} from '@ntb/utils';
import { knex } from '@ntb/db-utils';


type documentType =
  | 'area'
  | 'cabin'
  | 'poi'
  | 'route'
  | 'trip';


const logger = Logger.getLogger();
const DOCUMENT_TYPES: documentType[] = [
  'area',
  'cabin',
  'poi',
  'route',
  'trip',
];


async function createTempTable() {
  const timeStamp = moment().format('YYYYMMDDHHmmssSSS');
  const tableName = `0_${timeStamp}_unique_names`;

  logger.info(`Creating temp table: ${tableName}`);

  await knex.schema.createTable(tableName, (table) => {
    table.text('name')
      .primary();
    table.specificType('searchNb', 'TSVECTOR');
    table.specificType('areaIds', 'TEXT[]');
    table.specificType('cabinIds', 'TEXT[]');
    table.specificType('poiIds', 'TEXT[]');
    table.specificType('routeIds', 'TEXT[]');
    table.specificType('tripIds', 'TEXT[]');
    table.boolean('isArea');
    table.boolean('isCabin');
    table.boolean('isPoi');
    table.boolean('isRoute');
    table.boolean('isTrip');
    table.float('areaMaxScore');
    table.float('cabinMaxScore');
    table.float('poiMaxScore');
    table.float('routeMaxScore');
    table.float('tripMaxScore');
  });

  return tableName;
}


async function dropTempTable(tempTableName: string) {
  logger.info('Dropping temp table');
  await knex.schema.dropTableIfExists(tempTableName);
}


async function generateUniqueNamesForType(
  documentType: documentType,
  tempTableName: string,
): Promise<void> {
  logger.info(`Updating temp table with unique names for ${documentType}`);

  await knex.raw(`
    INSERT INTO "${tempTableName}" (
      name,
      search_nb,
      ${documentType}_ids,
      is_${documentType},
      ${documentType}_max_score
    )
    SELECT
      a.name_lower_case,
      to_tsvector('simple', a.name_lower_case),
      ARRAY(SELECT DISTINCT UNNEST(a.ids || u2.${documentType}_ids)),
      TRUE,
      a.boost
    FROM (
      SELECT
        x.name_lower_case,
        array_agg(
          x.id::TEXT
          ORDER BY
            (x.search_document_boost + x.search_document_manual_boost) DESC
        ) ids,
        MAX(x.search_document_boost + x.search_document_manual_boost) boost
      FROM ${documentType}s x
      ${
        documentType !== 'trip' ? '' : (`
          LEFT JOIN trips_to_groups ttg ON
            ttg.trip_id = x.id
        `)
      }
      WHERE
        x.name_lower_case IS NOT NULL
        AND LENGTH(x.name_lower_case) > 0
        AND x.provider = 'DNT'
        AND x.status = 'public'
        ${
          documentType !== 'trip' ? '' : (`
            AND ttg.trip_id IS NULL
          `)
        }
      GROUP BY
        x.name_lower_case
    ) a
    LEFT JOIN unique_names u2 ON
      u2.name = a.name_lower_case
    ON CONFLICT (name) DO UPDATE SET
      ${documentType}_ids = EXCLUDED.${documentType}_ids,
      is_${documentType} = TRUE,
      ${documentType}_max_score = EXCLUDED.${documentType}_max_score
  `);
}


async function mergeIntoUniqueNamesTable(tempTableName: string) {
  logger.info('Merging temp data into unique_names-table');

  await knex.raw(`
    INSERT INTO unique_names (
      name,
      search_nb,
      area_ids,
      cabin_ids,
      poi_ids,
      route_ids,
      trip_ids,
      autocomplete_rank
    )
    SELECT
      name,
      search_nb,
      area_ids,
      cabin_ids,
      poi_ids,
      route_ids,
      trip_ids,
      CASE
        WHEN is_cabin THEN 10000 + cabin_max_score
        WHEN is_route THEN 7000 + route_max_score
        WHEN is_trip THEN 4000 + trip_max_score
        WHEN is_poi THEN 1000 + poi_max_score
        ELSE 0
      END
    FROM "${tempTableName}" t
    ON CONFLICT (name) DO UPDATE SET
      area_ids = EXCLUDED.area_ids,
      cabin_ids = EXCLUDED.cabin_ids,
      poi_ids = EXCLUDED.poi_ids,
      route_ids = EXCLUDED.route_ids,
      trip_ids = EXCLUDED.trip_ids,
      autocomplete_rank = EXCLUDED.autocomplete_rank
  `);
}


async function deleteDeprecatedUniqueNames(tempTableName: string) {
  logger.info('Deleting deprecated unique names from unique_names-table');

  await knex.raw(`
    DELETE FROM unique_names
    USING unique_names u
    LEFT JOIN "${tempTableName}" t ON
      u.name = t.name
    WHERE
      t.name IS NULL
      AND public.unique_names.name = u.name
  `);
}


async function main(): Promise<void> {
  const tempTableName = await createTempTable();

  for (const documentType of DOCUMENT_TYPES) {
    await generateUniqueNamesForType(documentType, tempTableName);
  }

  await mergeIntoUniqueNamesTable(tempTableName);
  await deleteDeprecatedUniqueNames(tempTableName);
  await dropTempTable(tempTableName);
}


const durationId = startDuration();
main()
  .then(() => {
    logger.info('ALL DONE');
    printDuration(durationId);
    process.exit(0);
  })
  .catch((err) => {
    logger.error('UNCAUGHT ERROR');
    printDuration(durationId);
    logger.error(err);
    logger.error(err.stack);
    process.exit(1);
  });

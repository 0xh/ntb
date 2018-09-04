import {
  createLogger,
  startDuration,
  endDuration,
  moment,
} from '@ntb/shared-utils';
import { knex } from '@ntb/shared-db-utils';
import wfsDownload from '@ntb/shared-wfs-utils/download';


const logger = createLogger();

const SRS_NAME = 'urn:ogc:def:crs:EPSG::25833';
const TABLENAME = 'counties_municipalities_wfs_data';

const WFS = (
  'https://wfs.geonorge.no/skwms1/wfs.elf-au?service=WFS&version=2.0.0' +
  `&request=GetFeature&typeName=au:AdministrativeUnit&srsName=${SRS_NAME}`
);


async function truncateWfsData() {
  logger.info('Removing the current wfs-data');
  await knex.raw(`DROP TABLE "public"."${TABLENAME}"`)
    .catch((err) => {
      logger.warn(`Unable to drop the ${TABLENAME}-table`);
      logger.warn('-----');
      logger.warn(err.message);
      logger.warn('-----');
    });
}


async function downloadWfsData() {
  logger.debug('Downloading wfs data');
  const durationId = startDuration();

  const status = await wfsDownload(WFS, TABLENAME, true);

  if (status === false) {
    throw new Error('Downloading wfs failed.');
  }

  endDuration(durationId);
}


async function verifyWfsData() {
  logger.debug('Verifying wfs-data exists');
  const result = await knex(TABLENAME).count('*');

  if (!result || !result.length || !result[0] || !result[0].count) {
    throw new Error(`${TABLENAME} does not contain any rows?`);
  }
}


async function createTempGeometryTable() {
  logger.info('Create temp geometry table');
  const durationId = startDuration();

  const timeStamp = moment().format('YYYYMMDDHHmmssSSS');
  const tableName = `0_${timeStamp}_county_mun_wfs`;

  // Create temp table
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id')
      .primary();
    table.text('code');
    table.text('type');
    table.specificType('names', 'TEXT[]');
    table.specificType('languages', 'TEXT[]');
    table.specificType('geometry', 'GEOMETRY(MultiPolygon, 25833)');

    table.index('geometry', null, 'GIST');
  });

  endDuration(durationId);
  return tableName;
}


async function insertDataToTempGeometryTable(geometryTableName) {
  logger.info('Insert base data to temp table');
  const durationId = startDuration();

  await knex.raw(`
    INSERT INTO "${geometryTableName}"
      (id, code, type, names, languages, geometry)
    SELECT
      uuid_generate_v4(),
      nationalcode,
      localisedcharacterstring[1],
      string_to_array(
        substring(cmwfs."text" from '\\([0-9]+:(.+)\\)'),
        ','
      ),
      string_to_array(
        substring(cmwfs."language" from '\\([0-9]+:(.+)\\)'),
        ','
      ),
      wkb_geometry
    FROM counties_municipalities_wfs_data cmwfs
    WHERE
      localisedcharacterstring[1] =
        ANY ('{fylke,region,municipality,kommune}'::TEXT[])
  `);

  endDuration(durationId);
}


async function updateCounties(geometryTableName) {
  logger.info('Creating or updating counties');

  await knex.raw(`
    INSERT INTO counties (
      id,
      code,
      name,
      name_lower_case,
      status,
      data_source,
      created_at,
      updated_at,
      geometry
    )
    SELECT
      c.id,
      c.code,
      c."names"[1],
      LOWER(c."names"[1]),
      'public',
      'kartverket',
      now(),
      now(),
      c.geometry
    FROM "${geometryTableName}" c
    WHERE "type" = ANY ('{fylke,region}'::TEXT[])
    ON CONFLICT (code) DO UPDATE SET
      "name" = EXCLUDED."name",
      "name_lower_case" = EXCLUDED."name_lower_case",
      "geometry" = EXCLUDED."geometry"
  `);
}


async function deleteDeprecatedCounties(geometryTableName) {
  logger.info('Updating counties');

  await knex.raw(`
    DELETE FROM counties
    USING public.counties c
    LEFT JOIN "${geometryTableName}" t ON
      t.code = c.code
      AND "type" = ANY ('{fylke,region}'::TEXT[])
    WHERE
      t.code IS NULL
      AND public.counties.code = c.code
  `);
}


async function updateCountiesTranslations(geometryTableName) {
  logger.info('Updating county translations');

  await knex.raw(`
    INSERT INTO county_translations (
      id,
      county_id,
      name,
      name_lower_case,
      language,
      data_source,
      created_at,
      updated_at
    )
    SELECT
      uuid_generate_v4(),
      c.id,
      x.name,
      LOWER(x.name),
      x.lang,
      'kartverket',
      now(),
      now()
    FROM "${geometryTableName}" t
    JOIN unnest(names, languages) x ("name", "lang") ON true
    INNER JOIN counties c ON
      c.code = t.code
    WHERE
      cardinality(t.names) > 1
      AND t."type" = ANY ('{fylke,region}'::TEXT[])
      AND x.lang <> 'nor'
    ON CONFLICT (county_id, language) DO UPDATE SET
      "name" = EXCLUDED."name",
      "name_lower_case" = EXCLUDED."name_lower_case"
  `);
}


async function deleteDeprecatedCountyTranslations(geometryTableName) {
  logger.info('Delete deprecated county translations');

  await knex.raw(`
    DELETE FROM county_translations
    USING county_translations ct
    LEFT JOIN (
      SELECT
        c.id,
        x.name,
        x.lang
      FROM "${geometryTableName}" t
      LEFT JOIN unnest(names, languages) x(name, lang) ON true
      INNER JOIN counties c ON
        c.code = t.code
      WHERE
        cardinality(t.names) > 1
        AND t."type" = ANY ('{fylke,region}'::TEXT[])
        AND x.lang <> 'nor'
    ) cur ON
      ct.county_id = cur.id
      AND ct.language = cur.lang
    WHERE
      cur.id IS NULL
      AND public.county_translations.id = ct.id
  `);
}


async function updateMunicipalityTranslations(geometryTableName) {
  logger.info('Updating municipality translations');

  await knex.raw(`
    INSERT INTO municipality_translations (
      id,
      municipality_id,
      name,
      name_lower_case,
      language,
      data_source,
      created_at,
      updated_at
    )
    SELECT
      uuid_generate_v4(),
      c.id,
      x.name,
      LOWER(x.name),
      x.lang,
      'kartverket',
      now(),
      now()
    FROM "${geometryTableName}" t
    JOIN unnest(names, languages) x ("name", "lang") ON true
    INNER JOIN municipalities c ON
      c.code = t.code
    WHERE
      cardinality(t.names) > 1
      AND t."type" = ANY ('{municipality,kommune}'::TEXT[])
      AND x.lang <> 'nor'
    ON CONFLICT (municipality_id, language) DO UPDATE SET
      "name" = EXCLUDED."name",
      "name_lower_case" = EXCLUDED."name_lower_case"
  `);
}


async function deleteDeprecatedMunicipalityTranslations(geometryTableName) {
  logger.info('Delete deprecated municipality translations');

  await knex.raw(`
    DELETE FROM municipality_translations
    USING municipality_translations ct
    LEFT JOIN (
      SELECT
        c.id,
        x.name,
        x.lang
      FROM "${geometryTableName}" t
      LEFT JOIN unnest(names, languages) x(name, lang) ON true
      INNER JOIN municipalities c ON
        c.code = t.code
      WHERE
        cardinality(t.names) > 1
        AND t."type" = ANY ('{municipality,kommune}'::TEXT[])
        AND x.lang <> 'nor'
    ) cur ON
      ct.municipality_id = cur.id
      AND ct.language = cur.lang
    WHERE
      cur.id IS NULL
      AND public.municipality_translations.id = ct.id
  `);
}


async function updateMunicipalities(geometryTableName) {
  logger.info('Creating or updating municipalities');

  await knex.raw(`
    INSERT INTO municipalities (
      id,
      code,
      name,
      name_lower_case,
      status,
      data_source,
      created_at,
      updated_at,
      geometry
    )
    SELECT
      c.id,
      c.code,
      c."names"[1],
      LOWER(c."names"[1]),
      'public',
      'kartverket',
      now(),
      now(),
      c.geometry
    FROM "${geometryTableName}" c
    WHERE "type" = ANY ('{municipality,kommune}'::TEXT[])
    ON CONFLICT (code) DO UPDATE SET
      "name" = EXCLUDED."name",
      "name_lower_case" = EXCLUDED."name_lower_case",
      "geometry" = EXCLUDED."geometry"
  `);
}


async function deleteDeprecatedMunicipalities(geometryTableName) {
  logger.info('Updating municipalities');

  await knex.raw(`
    DELETE FROM municipalities
    USING public.municipalities c
    LEFT JOIN "${geometryTableName}" t ON
      t.code = c.code
      AND "type" = ANY ('{municipality,kommune}'::TEXT[])
    WHERE
      t.code IS NULL
      AND public.municipalities.code = c.code
  `);
}


async function dropTempTable(geometryTableName) {
  logger.info('Dropping temporary table');
  const durationId = startDuration();

  await knex.schema.dropTableIfExists(geometryTableName);

  endDuration(durationId);
}


async function main() {
  await truncateWfsData();
  await downloadWfsData();
  await verifyWfsData();
  const geometryTableName = await createTempGeometryTable();
  await insertDataToTempGeometryTable(geometryTableName);

  await updateCounties(geometryTableName);
  await deleteDeprecatedCounties(geometryTableName);
  await updateCountiesTranslations(geometryTableName);
  await deleteDeprecatedCountyTranslations(geometryTableName);

  await updateMunicipalities(geometryTableName);
  await deleteDeprecatedMunicipalities(geometryTableName);
  await updateMunicipalityTranslations(geometryTableName);
  await deleteDeprecatedMunicipalityTranslations(geometryTableName);

  await dropTempTable(geometryTableName);
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

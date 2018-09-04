import {
  createLogger,
  startDuration,
  endDuration,
} from '@ntb/shared-utils';
import { knex, Model } from '@ntb/shared-db-utils';
import { geomFromGeoJSON } from '@ntb/shared-gis-utils';

import * as legacy from '../legacy-structure/';


const logger = createLogger();


/**
 * Create temporary tables that will hold the processed data harvested from
 * legacy-ntb
 */
async function createTempTables(handler, first = false) {
  logger.info('Creating temporary tables');
  const durationId = startDuration();

  const baseTableName = `0_${handler.timeStamp}_harlegntb`;
  const tableName = `${baseTableName}_picture`;

  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('id')
        .primary();
      table.text('idLegacyNtb');
      table.uuid('areaId');
      table.uuid('cabinId');
      table.uuid('listId');
      table.uuid('poiId');
      table.uuid('routeId');
      table.uuid('tripId');
      table.integer('sortIndex');
      table.text('cabinPictureType');
      table.text('photographerName');
      table.text('photographerEmail');
      table.text('photographerCredit');
      table.text('description');
      table.specificType('coordinates', 'GEOMETRY(Point, 4326)');
      table.jsonb('original');
      table.jsonb('exif');
      table.jsonb('versions');
      table.text('license');
      table.text('provider');
      table.text('legacyFirstTag');
      table.specificType('legacyTags', 'TEXT[]');
      table.text('status');
      table.text('dataSource');
      table.timestamp('updatedAt');
    });
  }

  class TempPictureModel extends Model {
    static tableName = tableName;
  }
  handler.pictures.TempPictureModel = TempPictureModel;

  endDuration(durationId);
}


/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  await knex.schema
    .dropTableIfExists(handler.pictures.TempPictureModel.tableName);

  endDuration(durationId);
}


/**
 * Send legacy ntb data through a mapper that converts old structure to new
 */
async function mapData(handler) {
  logger.info('Mapping legacy data to new structure');
  const durationId = startDuration();
  const pictures = [];

  await Promise.all(
    handler.documents.bilder
      .map(async (d) => {
        const m = await legacy.bilder.mapping(d, handler);
        pictures.push(m);
      })
  );
  endDuration(durationId);

  handler.pictures.processed = pictures;
}


/**
 * Populate temporary tables with the processed legacy ntb data
 */
async function populateTempTables(handler) {
  logger.info('Inserting pictures to temporary table');
  const durationId = startDuration();
  const pictures = handler.pictures.processed.map((p) => {
    const { picture } = p;
    if (picture.coordinates) {
      picture.coordinates = geomFromGeoJSON(picture.coordinates);
    }

    if (picture.original) {
      picture.original = JSON.stringify(picture.original);
    }

    if (picture.exif) {
      picture.exif = JSON.stringify(picture.exif);
    }

    if (picture.versions) {
      picture.versions = JSON.stringify(picture.versions);
    }

    return picture;
  });
  await handler.pictures.TempPictureModel
    .query()
    .insert(pictures);
  endDuration(durationId);
}


/**
 * Insert into `picture`-table or update if it already exists
 */
async function mergePictures(handler) {
  const { tableName } = handler.pictures.TempPictureModel;

  const sql = [
    'INSERT INTO public.pictures (',
    '  id,',
    '  id_legacy_ntb,',
    '  photographer_name,',
    '  photographer_email,',
    '  photographer_credit,',
    '  description,',
    '  coordinates,',
    '  original,',
    '  exif,',
    '  versions,',
    '  legacy_first_tag,',
    '  legacy_tags,',
    '  license,',
    '  provider,',
    '  status,',
    '  data_source,',
    '  created_at,',
    '  updated_at',
    ')',
    'SELECT',
    '  id,',
    '  id_legacy_ntb,',
    '  photographer_name,',
    '  photographer_email,',
    '  photographer_credit,',
    '  description,',
    '  ST_Transform(coordinates, 25833),',
    '  original,',
    '  exif,',
    '  versions,',
    '  legacy_first_tag,',
    '  legacy_tags,',
    '  license,',
    '  provider,',
    '  status,',
    '  data_source,',
    '  updated_at,',
    '  updated_at',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (id_legacy_ntb) DO UPDATE',
    'SET',
    '  photographer_name = EXCLUDED.photographer_name,',
    '  photographer_email = EXCLUDED.photographer_email,',
    '  photographer_credit = EXCLUDED.photographer_credit,',
    '  description = EXCLUDED.description,',
    '  coordinates = EXCLUDED.coordinates,',
    '  original = EXCLUDED.original,',
    '  exif = EXCLUDED.exif,',
    '  versions = EXCLUDED.versions,',
    '  legacy_first_tag = EXCLUDED.legacy_first_tag,',
    '  legacy_tags = EXCLUDED.legacy_tags,',
    '  license = EXCLUDED.license,',
    '  provider = EXCLUDED.provider,',
    '  status = EXCLUDED.status,',
    '  data_source = EXCLUDED.data_source,',
    '  updated_at = EXCLUDED.updated_at',
  ].join('\n');

  logger.info('Creating or updating pictures');
  const durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);
}


/**
 * Process legacy picture data and merge it into the postgres database
 */
const process = async (handler) => {
  logger.info('Processing pictures');
  handler.pictures = {};

  await createTempTables(handler, false);
  await mergePictures(handler);
  await dropTempTables(handler);
};


/**
 * Map picture data
 */
export const mapPictureData = async (handler, first = false) => {
  logger.info('Mapping pictures');
  handler.pictures = {};

  await mapData(handler);
  await createTempTables(handler, first);
  await populateTempTables(handler);
};


export default process;

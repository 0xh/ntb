import {
  createLogger,
  startDuration,
  endDuration,
} from '@turistforeningen/ntb-shared-utils';
import { knex, Model } from '@turistforeningen/ntb-shared-db-utils';
import { geomFromGeoJSON } from '@turistforeningen/ntb-shared-gis-utils';

import * as legacy from '../legacy-structure/';


const logger = createLogger();
const DATASOURCE_NAME = 'legacy-ntb';

/**
 *
 * Create temporary tables that will hold the processed data harvested from
 * legacy-ntb
 */
async function createTempTables(handler, first = false) {
  logger.info('Creating temporary tables');
  const durationId = startDuration();

  const baseTableName = `0_${handler.timeStamp}_harlegntb`;

  let tableName = `${baseTableName}_areas`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('id')
        .primary();
      table.text('idLegacyNtb');
      table.text('name');
      table.text('nameLowerCase');
      table.text('description');
      table.text('descriptionPlain');
      table.specificType('geometry', 'GEOMETRY');
      table.text('map');
      table.text('url');
      table.text('license');
      table.text('provider');
      table.text('status');
      table.text('dataSource');

      table.timestamps(true, true);
    });
  }

  class TempAreaModel extends Model {
    static tableName = tableName;
  }
  handler.areas.TempAreaModel = TempAreaModel;


  tableName = `${baseTableName}_areasareas`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.text('parentLegacyId');
      table.uuid('parentId');
      table.text('childLegacyId');
      table.uuid('childId');
    });
  }

  class TempAreaAreaModel extends Model {
    static tableName = tableName;
    static idColumn = ['parentLegacyId', 'childLegacyId'];
  }
  handler.areas.TempAreaAreaModel = TempAreaAreaModel;


  tableName = `${baseTableName}_areaspic`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.text('areaLegacyId');
      table.uuid('areaId');
      table.text('pictureLegacyId');
      table.integer('sortIndex');
    });
  }

  class TempAreaPicturesModel extends Model {
    static tableName = tableName;
    static idColumn = ['areaLegacyId', 'pictureLegacyId'];
  }
  handler.areas.TempAreaPicturesModel = TempAreaPicturesModel;

  endDuration(durationId);
}

/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  await knex.schema
    .dropTableIfExists(handler.areas.TempAreaModel.tableName)
    .dropTableIfExists(handler.areas.TempAreaAreaModel.tableName)
    .dropTableIfExists(handler.areas.TempAreaPicturesModel.tableName);

  endDuration(durationId);
}


/**
 * Send legacy ntb data through a mapper that converts old structure to new
 */
async function mapData(handler) {
  logger.info('Mapping legacy data to new structure');
  const durationId = startDuration();
  const areas = [];

  await Promise.all(handler.documents['områder'].map(async (d) => {
    const m = await legacy.områder.mapping(d, handler);
    areas.push(m);
  }));
  endDuration(durationId);

  handler.areas.processed = areas;
}


/**
 * Populate temporary tables with the processed legacy ntb data
 */
async function populateTempTables(handler) {
  let durationId;

  logger.info('Inserting areas to temporary table');
  durationId = startDuration();
  const areas = handler.areas.processed.map((p) => {
    const { area } = p;
    if (area.geometry) {
      area.geometry = geomFromGeoJSON(area.geometry);
    }
    return area;
  });
  await handler.areas.TempAreaModel
    .query()
    .insert(areas);
  endDuration(durationId);

  // Process data for counties, minucipalities and area relations
  const areaArea = [];
  const pictures = [];
  handler.areas.processed.forEach((p) => {
    p.areaRelations.forEach((parentLegacyId) => areaArea.push({
      parentLegacyId,
      childLegacyId: p.area.idLegacyNtb,
    }));
    p.pictures.forEach((pictureLegacyId, idx) => pictures.push({
      pictureLegacyId,
      areaLegacyId: p.area.idLegacyNtb,
      sortIndex: idx,
    }));
  });

  // Insert temp data for AreaArea
  logger.info('Inserting area<>area to temporary table');
  durationId = startDuration();
  await handler.areas.TempAreaAreaModel
    .query()
    .insert(areaArea);
  endDuration(durationId);

  // Insert temp data for AreaArea
  logger.info('Inserting areas<>pictures to temporary table');
  durationId = startDuration();
  await handler.areas.TempAreaPicturesModel
    .query()
    .insert(pictures);
  endDuration(durationId);
}


/**
 * Insert into `area`-table or update if it already exists
 */
async function mergeAreas(handler) {
  const sql = [
    'INSERT INTO areas (',
    '  id,',
    '  id_legacy_ntb,',
    '  name,',
    '  name_lower_case,',
    '  description,',
    '  description_plain,',
    '  geometry,',
    '  map,',
    '  url,',
    '  license,',
    '  provider,',
    '  status,',
    '  data_source,',
    '  search_document_boost,',
    '  created_at,',
    '  updated_at',
    ')',
    'SELECT',
    '  id,',
    '  id_legacy_ntb,',
    '  name,',
    '  name_lower_case,',
    '  description,',
    '  description_plain,',
    '  geometry,',
    '  map,',
    '  url,',
    '  license,',
    '  provider,',
    '  status,',
    '  data_source,',
    '  1,',
    '  updated_at,',
    '  updated_at',
    `FROM "public"."${handler.areas.TempAreaModel.tableName}"`,
    'ON CONFLICT (id_legacy_ntb) DO UPDATE',
    'SET',
    '  name = EXCLUDED.name,',
    '  name_lower_case = EXCLUDED.name_lower_case,',
    '  description = EXCLUDED.description,',
    '  description_plain = EXCLUDED.description_plain,',
    '  geometry = EXCLUDED.geometry,',
    '  map = EXCLUDED.map,',
    '  url = EXCLUDED.url,',
    '  license = EXCLUDED.license,',
    '  provider = EXCLUDED.provider,',
    '  status = EXCLUDED.status,',
    '  updated_at = EXCLUDED.updated_at',
  ].join('\n');

  logger.info('Creating or updating areas');
  const durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);
}


/**
 * Insert into `areas_to_areas`-table or update if it already exists
 */
async function mergeAreaToArea(handler) {
  let sql;
  let durationId;

  // Set UUIDs on areaToArea temp data
  sql = [
    `UPDATE public."${handler.areas.TempAreaAreaModel.tableName}" a1 SET`,
    '  child_id = a_child.id,',
    '  parent_id = a_parent.id',
    `FROM public."${handler.areas.TempAreaAreaModel.tableName}" a2`,
    'INNER JOIN public.areas a_parent ON',
    '  a_parent.id_legacy_ntb = a2.parent_legacy_id',
    'INNER JOIN public.areas a_child ON',
    '  a_child.id_legacy_ntb = a2.child_legacy_id',
    'WHERE',
    '  a1.child_legacy_id = a2.child_legacy_id AND',
    '  a1.parent_legacy_id = a2.parent_legacy_id',
  ].join('\n');

  logger.info('Update ids on area-to-area temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO areas_to_areas (',
    '  parent_id, child_id, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  parent_id, child_id, :data_source, now(), now()',
    `FROM public."${handler.areas.TempAreaAreaModel.tableName}"`,
    'ON CONFLICT (parent_id, child_id) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating area to area relations');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove area to area relations that no longer exist in legacy-ntb
 */
async function removeDepreactedAreaToArea(handler) {
  const sql = [
    'DELETE FROM public.areas_to_areas',
    'USING public.areas_to_areas a2a',
    `LEFT JOIN public."${handler.areas.TempAreaAreaModel.tableName}" te ON`,
    '  a2a.parent_id = te.parent_id AND',
    '  a2a.child_id = te.child_id',
    'WHERE',
    '  te.child_id IS NULL AND',
    '  a2a.data_source = :data_source AND',
    '  public.areas_to_areas.parent_id = a2a.parent_id AND',
    '  public.areas_to_areas.child_id = a2a.child_id',
  ].join('\n');

  logger.info('Deleting deprecated area to area relations');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Insert area id into `pictures`-table
 */
async function setAreaPictures(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.areas.TempAreaPicturesModel;

  // Set UUIDs on areaToArea temp data
  sql = [
    `UPDATE "public"."${tableName}" a1 SET`,
    '  area_id = a.id',
    `FROM "public"."${tableName}" a2`,
    'INNER JOIN public.areas a ON',
    '  a.id_legacy_ntb = a2.area_legacy_id',
    'WHERE',
    '  a1.area_legacy_id = a2.area_legacy_id AND',
    '  a1.picture_legacy_id = a2.picture_legacy_id',
  ].join('\n');

  logger.info('Update id on area-to-picture temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'UPDATE pictures p1 SET',
    '  area_id = a.area_id,',
    '  sort_index = a.sort_index',
    'FROM pictures p2',
    `INNER JOIN "public"."${tableName}" a ON`,
    '  a.picture_legacy_id = p2.id_legacy_ntb',
    'WHERE',
    '  p1.id = p2.id',
  ].join('\n');

  logger.info('Setting area id on pictures');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove pictures that used to belong to an area in legacy-ntb
 */
async function removeDepreactedAreaPictures(handler) {
  const { tableName } = handler.areas.TempAreaPicturesModel;
  const sql = [
    'DELETE FROM public.pictures',
    'USING public.pictures p2',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  p2.id_legacy_ntb = te.picture_legacy_id',
    'WHERE',
    '  te.picture_legacy_id IS NULL AND',
    '  p2.area_id IS NOT NULL AND',
    '  p2.data_source = :data_source AND',
    '  public.pictures.id = p2.id',
  ].join('\n');

  logger.info('Deleting deprecated area pictures');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Mark areas that no longer exist in legacy-ntb as deleted
 */
async function removeDepreactedArea(handler) {
  const { tableName } = handler.areas.TempAreaModel;
  const sql = [
    'UPDATE public.areas a1 SET',
    '  status = :status',
    'FROM public.areas a2',
    `LEFT JOIN "public"."${tableName}" t ON`,
    '  t.id_legacy_ntb = a2.id_legacy_ntb',
    'WHERE',
    '  t.id_legacy_ntb IS NULL AND',
    '  a1.id = a2.id AND',
    '  a2.data_source = :data_source AND',
    '  a2.status != :status',
  ].join('\n');

  logger.info('Marking deprecated areas as deleted');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
    status: 'deleted',
  });
  endDuration(durationId);
}


/**
 * Process legacy area data and merge it into the postgres database
 */
const process = async (handler) => {
  logger.info('Processing areas');
  handler.areas = {};


  await createTempTables(handler, false);
  await mergeAreas(handler);
  await mergeAreaToArea(handler);
  await removeDepreactedAreaToArea(handler);
  await setAreaPictures(handler);
  await removeDepreactedAreaPictures(handler);
  await removeDepreactedArea(handler);
  await dropTempTables(handler);
};


/**
 * Map area data
 */
export const mapAreaData = async (handler, first = false) => {
  logger.info('Mapping areas');
  handler.areas = {};

  await mapData(handler);
  await createTempTables(handler, first);
  await populateTempTables(handler);
};


export default process;

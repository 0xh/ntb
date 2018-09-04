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
 * Create temporary tables that will hold the processed data harvested from
 * legacy-ntb
 */
async function createTempTables(handler, first = false) {
  logger.info('Creating temporary tables');
  const durationId = startDuration();

  const baseTableName = `0_${handler.timeStamp}_harlegntb`;

  // lists
  let tableName = `${baseTableName}_list`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('id')
        .primary();
      table.text('idLegacyNtb');
      table.text('listType');
      table.text('name');
      table.text('nameLowerCase');
      table.text('description');
      table.text('descriptionPlain');
      table.specificType('coordinates', 'GEOMETRY(MultiPoint, 4326)');
      table.timestamp('startDate');
      table.timestamp('endDate');
      table.text('license');
      table.text('provider');
      table.text('status');
      table.text('dataSource');
      table.timestamp('updatedAt');
    });
  }

  class TempListModel extends Model {
    static tableName = tableName;
  }
  handler.lists.TempListModel = TempListModel;


  // list links
  tableName = `${baseTableName}_list_links`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('id')
        .primary();
      table.text('title');
      table.text('url');
      table.uuid('listId');
      table.text('idListLegacyNtb');
      table.text('type');
      table.integer('sortIndex');
      table.text('dataSource');
      table.timestamp('updatedAt');
    });
  }

  class TempListLinkModel extends Model {
    static tableName = tableName;
  }
  handler.lists.TempListLinkModel = TempListLinkModel;


  // lists to cabins/pois
  tableName = `${baseTableName}_list_cabpoi`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('listId');
      table.uuid('documentId');
      table.text('documentType');
      table.text('listLegacyId');
      table.text('documentLegacyId');
      table.integer('sortIndex');

      table.primary(['listLegacyId', 'documentLegacyId']);
    });
  }

  class TempListCabinPoi extends Model {
    static tableName = tableName;
    static idColumn = ['listLegacyId', 'documentLegacyId'];
  }
  handler.lists.TempListCabinPoi = TempListCabinPoi;


  // lists to groups
  tableName = `${baseTableName}_list_group`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('listId');
      table.uuid('groupId');
      table.text('listLegacyId');
      table.text('groupLegacyId');
      table.integer('sortIndex');

      table.primary(['listLegacyId', 'groupLegacyId']);
    });
  }

  class TempListToGroupModel extends Model {
    static tableName = tableName;
    static idColumn = ['listLegacyId', 'groupLegacyId'];
  }
  handler.lists.TempListToGroupModel = TempListToGroupModel;


  // lists pictures
  tableName = `${baseTableName}_list_pic`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('listId');
      table.text('listLegacyId');
      table.text('pictureLegacyId');
      table.integer('sortIndex');

      table.primary(['listLegacyId', 'pictureLegacyId']);
    });
  }

  class TempListPicturesModel extends Model {
    static tableName = tableName;
    static idColumn = ['listLegacyId', 'pictureLegacyId'];
  }
  handler.lists.TempListPicturesModel = TempListPicturesModel;


  endDuration(durationId);
}


/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  await knex.schema
    .dropTableIfExists(handler.lists.TempListModel.tableName)
    .dropTableIfExists(handler.lists.TempListLinkModel.tableName)
    .dropTableIfExists(handler.lists.TempListCabinPoi.tableName)
    .dropTableIfExists(handler.lists.TempListToGroupModel.tableName)
    .dropTableIfExists(handler.lists.TempListPicturesModel.tableName);

  endDuration(durationId);
}


/**
 * Send legacy ntb data through a mapper that converts old structure to new
 */
async function mapData(handler) {
  logger.info('Mapping legacy data to new structure');
  const durationId = startDuration();
  const lists = [];

  await Promise.all(
    handler.documents.lister
      .filter((d) => !d.tags || d.tags[0] !== 'Hytte')
      .map(async (d) => {
        const m = await legacy.lister.mapping(d, handler);
        lists.push(m);
      })
  );
  endDuration(durationId);

  handler.lists.processed = lists;
}


/**
 * Populate temporary tables with the processed legacy ntb data
 */
async function populateTempTables(handler) {
  let durationId;

  logger.info('Inserting lists to temporary table');
  durationId = startDuration();
  const lists = handler.lists.processed.map((p) => {
    const { list } = p;
    if (list.coordinates) {
      list.coordinates = geomFromGeoJSON(list.coordinates);
    }
    return list;
  });
  await handler.lists.TempListModel
    .query()
    .insert(lists);
  endDuration(durationId);

  const groups = [];
  const poisAndCabins = [];
  const pictures = [];
  let links = [];
  handler.lists.processed.forEach((p) => {
    links = links.concat(p.links);

    p.pictures.forEach((pictureLegacyId, idx) => {
      const exists = pictures
        .some((pic) => (
          pic.pictureLegacyId === pictureLegacyId
          && pic.listLegacyId === p.list.idLegacyNtb
        ));

      if (!exists) {
        pictures.push({
          pictureLegacyId,
          listLegacyId: p.list.idLegacyNtb,
          sortIndex: idx,
        });
      }
    });

    p.groups.forEach((groupLegacyId) => groups.push({
      groupLegacyId,
      listLegacyId: p.list.idLegacyNtb,
    }));

    p.poisAndCabins.forEach((documentLegacyId, idx) => poisAndCabins.push({
      documentLegacyId,
      listLegacyId: p.list.idLegacyNtb,
      sortIndex: idx,
    }));
  });

  // Insert temp data for ListLink
  logger.info('Inserting list links to temporary table');
  durationId = startDuration();
  await handler.lists.TempListLinkModel
    .query()
    .insert(links);
  endDuration(durationId);

  // Insert temp data for List pictures
  logger.info('Inserting list pictures to temporary table');
  durationId = startDuration();
  await handler.lists.TempListPicturesModel
    .query()
    .insert(pictures);
  endDuration(durationId);

  // Insert temp data for ListCabinPoi
  logger.info('Inserting list documents to temporary table');
  durationId = startDuration();
  await handler.lists.TempListCabinPoi
    .query()
    .insert(poisAndCabins);
  endDuration(durationId);

  // Insert temp data for ListToGroup
  logger.info('Inserting list groups to temporary table');
  durationId = startDuration();
  await handler.lists.TempListToGroupModel
    .query()
    .insert(groups);
  endDuration(durationId);
}


/**
 * Insert into `list`-table or update if it already exists
 */
async function mergeList(handler) {
  const { tableName } = handler.lists.TempListModel;

  // Merge into prod table
  const sql = [
    'INSERT INTO lists (',
    '  id,',
    '  id_legacy_ntb,',
    '  list_type,',
    '  name,',
    '  name_lower_case,',
    '  description,',
    '  description_plain,',
    '  coordinates,',
    '  start_date,',
    '  end_date,',
    '  license,',
    '  provider,',
    '  status,',
    '  data_source,',
    '  updated_at,',
    '  created_at,',
    '  search_document_boost',
    ')',
    'SELECT',
    '  id,',
    '  id_legacy_ntb,',
    '  \'sjekkut\',',
    '  name,',
    '  name_lower_case,',
    '  description,',
    '  description_plain,',
    '  ST_Transform(coordinates, 25833),',
    '  start_date,',
    '  end_date,',
    '  license,',
    '  provider,',
    '  status,',
    '  :data_source,',
    '  updated_at,',
    '  updated_at,',
    '  1',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (id_legacy_ntb) DO UPDATE',
    'SET',
    '   "name" = EXCLUDED."name",',
    '   "name_lower_case" = EXCLUDED."name_lower_case",',
    '   "description" = EXCLUDED."description",',
    '   "description_plain" = EXCLUDED."description_plain",',
    '   "coordinates" = EXCLUDED."coordinates",',
    '   "start_date" = EXCLUDED."start_date",',
    '   "end_date" = EXCLUDED."end_date",',
    '   "license" = EXCLUDED."license",',
    '   "provider" = EXCLUDED."provider",',
    '   "status" = EXCLUDED."status",',
    '   "data_source" = EXCLUDED."data_source",',
    '   "updated_at" = EXCLUDED."updated_at"',
  ].join('\n');

  logger.info('Creating or updating lists');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Insert into `list_link`-table or update if it already exists
 */
async function mergeListLinks(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.lists.TempListLinkModel;

  // Set ids on listLink temp data
  sql = [
    `UPDATE "public"."${tableName}" gl1 SET`,
    '  list_id = g.id',
    `FROM "public"."${tableName}" gl2`,
    'INNER JOIN public.lists g ON',
    '  g.id_legacy_ntb = gl2.id_list_legacy_ntb',
    'WHERE',
    '  gl1.id_list_legacy_ntb = gl2.id_list_legacy_ntb AND',
    '  gl1.sort_index = gl2.sort_index',
  ].join('\n');

  logger.info('Update ids on list links temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO list_links (',
    '  id,',
    '  list_id,',
    '  title,',
    '  "type",',
    '  url,',
    '  sort_index,',
    '  data_source,',
    '  created_at,',
    '  updated_at',
    ')',
    'SELECT',
    '  id,',
    '  list_id,',
    '  title,',
    '  "type",',
    '  url,',
    '  sort_index,',
    '  :data_source,',
    '  now(),',
    '  now()',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (list_id, sort_index) DO UPDATE',
    'SET',
    '  title = EXCLUDED.title,',
    '  "type" = EXCLUDED."type",',
    '  url = EXCLUDED.url',
  ].join('\n');

  logger.info('Creating or updating list links');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove list links that no longer exist in legacy-ntb
 */
async function removeDepreactedListLinks(handler) {
  const { tableName } = handler.lists.TempListLinkModel;
  const sql = [
    'DELETE FROM public.list_links',
    'USING public.list_links gl',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  gl.list_id = te.list_id AND',
    '  gl.sort_index = te.sort_index',
    'WHERE',
    '  te.id_list_legacy_ntb IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.list_links.list_id = gl.list_id AND',
    '  public.list_links.sort_index = gl.sort_index',
  ].join('\n');

  logger.info('Deleting deprecated list links');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Insert into `lists_to_groups`-table or update if it already exists
 */
async function mergeListToGroup(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.lists.TempListToGroupModel;

  // Set ids on listToGroup temp data
  sql = [
    `UPDATE "public"."${tableName}" a1 SET`,
    '  list_id = c.id,',
    '  group_id = a.id',
    `FROM "public"."${tableName}" a2`,
    'INNER JOIN public.groups a ON',
    '  a.id_legacy_ntb = a2.group_legacy_id',
    'INNER JOIN public.lists c ON',
    '  c.id_legacy_ntb = a2.list_legacy_id',
    'WHERE',
    '  a1.group_legacy_id = a2.group_legacy_id AND',
    '  a1.list_legacy_id = a2.list_legacy_id',
  ].join('\n');

  logger.info('Update ids on list-to-group temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO lists_to_groups (',
    '  list_id, group_id, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  list_id, group_id, :data_source, now(), now()',
    `FROM "public"."${tableName}"`,
    'WHERE list_id IS NOT NULL AND group_id IS NOT NULL',
    'ON CONFLICT (list_id, group_id) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating list to group relations');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove list to group relations that no longer exist in legacy-ntb
 */
async function removeDepreactedListToGroup(handler) {
  const { tableName } = handler.lists.TempListToGroupModel;

  const sql = [
    'DELETE FROM public.lists_to_groups',
    'USING public.lists_to_groups c2a',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  c2a.list_id = te.list_id AND',
    '  c2a.group_id = te.group_id',
    'WHERE',
    '  te.group_id IS NULL AND',
    '  c2a.data_source = :data_source AND',
    '  public.lists_to_groups.list_id = c2a.list_id AND',
    '  public.lists_to_groups.group_id = c2a.group_id',
  ].join('\n');

  logger.info('Deleting deprecated list to group relations');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Insert list id into `pictures`-table
 */
async function setListPictures(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.lists.TempListPicturesModel;

  // Set ids on listToList temp data
  sql = [
    `UPDATE "public"."${tableName}" a1 SET`,
    '  list_id = a.id',
    `FROM "public"."${tableName}" a2`,
    'INNER JOIN public.lists a ON',
    '  a.id_legacy_ntb = a2.list_legacy_id',
    'WHERE',
    '  a1.list_legacy_id = a2.list_legacy_id AND',
    '  a1.picture_legacy_id = a2.picture_legacy_id',
  ].join('\n');

  logger.info('Update ids on list-to-picture temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'UPDATE pictures p1 SET',
    '  list_id = a.list_id,',
    '  sort_index = a.sort_index',
    'FROM pictures p2',
    `INNER JOIN "public"."${tableName}" a ON`,
    '  a.picture_legacy_id = p2.id_legacy_ntb',
    'WHERE',
    '  p1.id = p2.id',
  ].join('\n');

  logger.info('Setting list id on pictures');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove pictures that used to belong to an list in legacy-ntb
 */
async function removeDepreactedListPictures(handler) {
  const { tableName } = handler.lists.TempListPicturesModel;
  const sql = [
    'DELETE FROM public.pictures',
    'USING public.pictures p2',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  p2.id_legacy_ntb = te.picture_legacy_id',
    'WHERE',
    '  te.picture_legacy_id IS NULL AND',
    '  p2.list_id IS NOT NULL AND',
    '  p2.data_source = :data_source AND',
    '  public.pictures.id = p2.id',
  ].join('\n');

  logger.info('Deleting deprecated list pictures');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Insert into `list_relation`-table or update if it already exists
 */
async function mergeListRelation(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.lists.TempListCabinPoi;

  // Set list ids on TempListCabinPoi temp data
  sql = [
    `UPDATE "public"."${tableName}" a1 SET`,
    '  list_id = c.id',
    `FROM "public"."${tableName}" a2`,
    'INNER JOIN public.lists c ON',
    '  c.id_legacy_ntb = a2.list_legacy_id',
    'WHERE',
    '  a1.document_legacy_id = a2.document_legacy_id AND',
    '  a1.list_legacy_id = a2.list_legacy_id',
  ].join('\n');

  logger.info('Update list ids on list-relations temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Set cabin ids on TempListCabinPoi temp data
  sql = [
    `UPDATE "public"."${tableName}" a1 SET`,
    '  document_id = c.id,',
    '  document_type = \'cabin\'',
    `FROM "public"."${tableName}" a2`,
    'INNER JOIN public.cabins c ON',
    '  c.id_legacy_ntb = a2.document_legacy_id',
    'WHERE',
    '  a1.document_legacy_id = a2.document_legacy_id AND',
    '  a1.list_legacy_id = a2.list_legacy_id',
  ].join('\n');

  logger.info('Update cabin ids on list-relations temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Set poi ids on TempListCabinPoi temp data
  sql = [
    `UPDATE "public"."${tableName}" a1 SET`,
    '  document_id = c.id,',
    '  document_type = \'poi\'',
    `FROM "public"."${tableName}" a2`,
    'INNER JOIN public.pois c ON',
    '  c.id_legacy_ntb = a2.document_legacy_id',
    'WHERE',
    '  a1.document_legacy_id = a2.document_legacy_id AND',
    '  a1.list_legacy_id = a2.list_legacy_id',
  ].join('\n');

  logger.info('Update poi ids on list-relations temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);


  // Merge into prod table
  sql = [
    'INSERT INTO list_relations (',
    '  list_id,',
    '  document_type,',
    '  document_id,',
    '  sort_index,',
    '  data_source',
    ')',
    'SELECT',
    '  list_id,',
    '  document_type,',
    '  document_id,',
    '  sort_index,',
    '  :data_source',
    `FROM "public"."${tableName}"`,
    'WHERE list_id IS NOT NULL AND document_id IS NOT NULL',
    'ON CONFLICT (list_id, document_type, document_id) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating list to document relations');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove list to group relations that no longer exist in legacy-ntb
 */
async function removeDepreactedListRelations(handler) {
  const { tableName } = handler.lists.TempListCabinPoi;

  const sql = [
    'DELETE FROM public.list_relations',
    'USING public.list_relations c2a',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  c2a.list_id = te.list_id AND',
    '  c2a.document_id = te.document_id',
    'WHERE',
    '  te.document_id IS NULL AND',
    '  c2a.data_source = :data_source AND',
    '  public.list_relations.list_id = c2a.list_id AND',
    '  public.list_relations.document_id = c2a.document_id',
  ].join('\n');

  logger.info('Deleting deprecated list relations');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Mark lists that no longer exist in legacy-ntb as deleted
 */
async function removeDepreactedList(handler) {
  const { tableName } = handler.lists.TempListModel;
  const sql = [
    'UPDATE public.lists a1 SET',
    '  status = :status',
    'FROM public.lists a2',
    `LEFT JOIN "public"."${tableName}" t ON`,
    '  t.id_legacy_ntb = a2.id_legacy_ntb',
    'WHERE',
    '  t.id_legacy_ntb IS NULL AND',
    '  a1.id = a2.id AND',
    '  a2.data_source = :data_source AND',
    '  a2.status != :status',
  ].join('\n');

  logger.info('Marking deprecated lists as deleted');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
    status: 'deleted',
  });
  endDuration(durationId);
}


/**
 * Process legacy list data and merge it into the postgres database
 */
const process = async (handler, fullHarvest = false) => {
  logger.info('Processing lists');
  handler.lists = {};

  await createTempTables(handler, false);
  await mergeList(handler);
  await mergeListLinks(handler);
  if (fullHarvest) await removeDepreactedListLinks(handler);
  await mergeListToGroup(handler);
  if (fullHarvest) await removeDepreactedListToGroup(handler);
  await setListPictures(handler);
  if (fullHarvest) await removeDepreactedListPictures(handler);
  await mergeListRelation(handler);
  if (fullHarvest) await removeDepreactedListRelations(handler);
  if (fullHarvest) await removeDepreactedList(handler);
  await dropTempTables(handler);
};


/**
 * Map list data
 */
export const mapListData = async (handler, first = false) => {
  logger.info('Mapping lists');
  handler.lists = {};

  await mapData(handler);
  await createTempTables(handler, first);
  await populateTempTables(handler);
};


export default process;

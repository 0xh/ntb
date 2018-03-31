import db from '@turistforeningen/ntb-shared-models';
import { createLogger, startDuration, endDuration } from
  '@turistforeningen/ntb-shared-utils';

import * as legacy from '../legacy-structure/';


const logger = createLogger();
const DATASOURCE_NAME = 'legacy-ntb';


/**
 * Create temporary tables that will hold the processed data harvested from
 * legacy-ntb
 */
async function createTempTables(handler) {
  logger.info('Creating temporary tables');
  const durationId = startDuration();

  const baseTableName = `_temp_legacy_ntb_harvest_${handler.timeStamp}`;

  let tableName = `${baseTableName}_list`;
  handler.lists.TempListModel = db.sequelize.define(tableName, {
    uuid: { type: db.Sequelize.UUID, primaryKey: true },
    idLegacyNtb: { type: db.Sequelize.TEXT },
    listType: { type: db.Sequelize.TEXT },
    name: { type: db.Sequelize.TEXT },
    nameLowerCase: { type: db.Sequelize.TEXT },
    description: { type: db.Sequelize.TEXT },
    descriptionPlain: { type: db.Sequelize.TEXT },
    coordinates: { type: db.Sequelize.GEOMETRY },
    startDate: { type: db.Sequelize.DATE },
    endDate: { type: db.Sequelize.DATE },
    license: { type: db.Sequelize.TEXT },
    provider: { type: db.Sequelize.TEXT },
    status: { type: db.Sequelize.TEXT },
    dataSource: { type: db.Sequelize.TEXT },
    updatedAt: { type: db.Sequelize.DATE },
  }, {
    timestamps: false,
    tableName,
  });
  await handler.lists.TempListModel.sync();

  tableName = `${baseTableName}_list_links`;
  handler.lists.TempListLinkModel =
    db.sequelize.define(tableName, {
      uuid: { type: db.Sequelize.UUID, primaryKey: true },
      title: { type: db.Sequelize.TEXT, allowNull: true },
      url: { type: db.Sequelize.TEXT },
      listUuid: { type: db.Sequelize.UUID, allowNull: true },
      idListLegacyNtb: { type: db.Sequelize.TEXT },
      type: { type: db.Sequelize.TEXT },
      sortIndex: { type: db.Sequelize.INTEGER },
      dataSource: { type: db.Sequelize.TEXT },
      updatedAt: { type: db.Sequelize.DATE },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.lists.TempListLinkModel.sync();

  tableName = `${baseTableName}_list_to_cabinpoi`;
  handler.lists.TempListCabinPoi =
    db.sequelize.define(tableName, {
      listUuid: { type: db.Sequelize.UUID },
      documentUuid: { type: db.Sequelize.UUID },
      listLegacyId: { type: db.Sequelize.TEXT },
      documentLegacyId: { type: db.Sequelize.TEXT },
      documentType: { type: db.Sequelize.TEXT },
      sortIndex: { type: db.Sequelize.INTEGER },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.lists.TempListCabinPoi.sync();

  tableName = `${baseTableName}_list_to_group`;
  handler.lists.TempListToGroupModel =
    db.sequelize.define(tableName, {
      listUuid: { type: db.Sequelize.UUID },
      groupUuid: { type: db.Sequelize.UUID },
      listLegacyId: { type: db.Sequelize.TEXT },
      groupLegacyId: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.lists.TempListToGroupModel.sync();

  tableName = `${baseTableName}_list_pictures`;
  handler.lists.TempListPicturesModel =
    db.sequelize.define(tableName, {
      listLegacyId: { type: db.Sequelize.TEXT },
      listUuid: { type: db.Sequelize.UUID },
      pictureLegacyId: { type: db.Sequelize.TEXT },
      sortIndex: { type: db.Sequelize.INTEGER },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.lists.TempListPicturesModel.sync();


  endDuration(durationId);
}


/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  await handler.lists.TempListModel.drop();
  await handler.lists.TempListLinkModel.drop();
  await handler.lists.TempListToGroupModel.drop();
  await handler.lists.TempListPicturesModel.drop();

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
  const lists = handler.lists.processed.map((p) => p.list);
  await handler.lists.TempListModel.bulkCreate(lists);
  endDuration(durationId);

  const groups = [];
  const poisAndCabins = [];
  const pictures = [];
  let links = [];
  handler.lists.processed.forEach((p) => {
    links = links.concat(p.links);

    p.pictures.forEach((pictureLegacyId, idx) => pictures.push({
      pictureLegacyId,
      listLegacyId: p.list.idLegacyNtb,
      sortIndex: idx,
    }));

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
  await handler.lists.TempListLinkModel.bulkCreate(links);
  endDuration(durationId);

  // Insert temp data for List pictures
  logger.info('Inserting list pictures to temporary table');
  durationId = startDuration();
  await handler.lists.TempListPicturesModel.bulkCreate(pictures);
  endDuration(durationId);

  // Insert temp data for ListCabinPoi
  logger.info('Inserting list documents to temporary table');
  durationId = startDuration();
  await handler.lists.TempListCabinPoi.bulkCreate(poisAndCabins);
  endDuration(durationId);

  // Insert temp data for ListToGroup
  logger.info('Inserting list groups to temporary table');
  durationId = startDuration();
  await handler.lists.TempListToGroupModel.bulkCreate(groups);
  endDuration(durationId);
}


/**
 * Insert into `list`-table or update if it already exists
 */
async function mergeList(handler) {
  const { tableName } = handler.lists.TempListModel;

  // Merge into prod table
  const sql = [
    'INSERT INTO list (',
    '  uuid,',
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
    '  uuid,',
    '  id_legacy_ntb,',
    '  \'sjekkut\',',
    '  name,',
    '  name_lower_case,',
    '  description,',
    '  description_plain,',
    '  coordinates,',
    '  start_date,',
    '  end_date,',
    '  license,',
    '  provider,',
    '  status::enum_list_status,',
    '  :data_source,',
    '  updated_at,',
    '  updated_at,',
    '  1',
    `FROM public.${tableName}`,
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
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
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

  // Set UUIDs on listLink temp data
  sql = [
    `UPDATE public.${tableName} gl1 SET`,
    '  list_uuid = g.uuid',
    `FROM public.${tableName} gl2`,
    'INNER JOIN public.list g ON',
    '  g.id_legacy_ntb = gl2.id_list_legacy_ntb',
    'WHERE',
    '  gl1.id_list_legacy_ntb = gl2.id_list_legacy_ntb AND',
    '  gl1.sort_index = gl2.sort_index',
  ].join('\n');

  logger.info('Update uuids on list links temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO list_link (',
    '  uuid,',
    '  list_uuid,',
    '  title,',
    '  "type",',
    '  url,',
    '  sort_index,',
    '  data_source,',
    '  created_at,',
    '  updated_at',
    ')',
    'SELECT',
    '  uuid,',
    '  list_uuid,',
    '  title,',
    '  "type",',
    '  url,',
    '  sort_index,',
    '  :data_source,',
    '  now(),',
    '  now()',
    `FROM public.${tableName}`,
    'ON CONFLICT (list_uuid, sort_index) DO UPDATE',
    'SET',
    '  title = EXCLUDED.title,',
    '  "type" = EXCLUDED."type",',
    '  url = EXCLUDED.url',
  ].join('\n');

  logger.info('Creating or updating list links');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove list links that no longer exist in legacy-ntb
 */
async function removeDepreactedListLinks(handler) {
  const { tableName } = handler.lists.TempListLinkModel;
  const sql = [
    'DELETE FROM public.list_link',
    'USING public.list_link gl',
    `LEFT JOIN public.${tableName} te ON`,
    '  gl.list_uuid = te.list_uuid AND',
    '  gl.sort_index = te.sort_index',
    'WHERE',
    '  te.id_list_legacy_ntb IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.list_link.list_uuid = gl.list_uuid AND',
    '  public.list_link.sort_index = gl.sort_index',
  ].join('\n');

  logger.info('Deleting deprecated list links');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Insert into `list_to_group`-table or update if it already exists
 */
async function mergeListToGroup(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.lists.TempListToGroupModel;

  // Set UUIDs on listToGroup temp data
  sql = [
    `UPDATE public.${tableName} a1 SET`,
    '  list_uuid = c.uuid,',
    '  group_uuid = a.uuid',
    `FROM public.${tableName} a2`,
    'INNER JOIN public.group a ON',
    '  a.id_legacy_ntb = a2.group_legacy_id',
    'INNER JOIN public.list c ON',
    '  c.id_legacy_ntb = a2.list_legacy_id',
    'WHERE',
    '  a1.group_legacy_id = a2.group_legacy_id AND',
    '  a1.list_legacy_id = a2.list_legacy_id',
  ].join('\n');

  logger.info('Update uuids on list-to-group temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO list_to_group (',
    '  list_uuid, group_uuid, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  list_uuid, group_uuid, :data_source, now(), now()',
    `FROM public.${tableName}`,
    'WHERE list_uuid IS NOT NULL AND group_uuid IS NOT NULL',
    'ON CONFLICT (list_uuid, group_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating list to group relations');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove list to group relations that no longer exist in legacy-ntb
 */
async function removeDepreactedListToGroup(handler) {
  const { tableName } = handler.lists.TempListToGroupModel;

  const sql = [
    'DELETE FROM public.list_to_group',
    'USING public.list_to_group c2a',
    `LEFT JOIN public.${tableName} te ON`,
    '  c2a.list_uuid = te.list_uuid AND',
    '  c2a.group_uuid = te.group_uuid',
    'WHERE',
    '  te.group_uuid IS NULL AND',
    '  c2a.data_source = :data_source AND',
    '  public.list_to_group.list_uuid = c2a.list_uuid AND',
    '  public.list_to_group.group_uuid = c2a.group_uuid',
  ].join('\n');

  logger.info('Deleting deprecated list to group relations');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Insert list uuid into `pictures`-table
 */
async function setListPictures(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.lists.TempListPicturesModel;

  // Set UUIDs on listToList temp data
  sql = [
    `UPDATE public.${tableName} a1 SET`,
    '  list_uuid = a.uuid',
    `FROM public.${tableName} a2`,
    'INNER JOIN public.list a ON',
    '  a.id_legacy_ntb = a2.list_legacy_id',
    'WHERE',
    '  a1.list_legacy_id = a2.list_legacy_id AND',
    '  a1.picture_legacy_id = a2.picture_legacy_id',
  ].join('\n');

  logger.info('Update uuids on list-to-picture temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'UPDATE picture p1 SET',
    '  list_uuid = a.list_uuid,',
    '  sort_index = a.sort_index',
    'FROM picture p2',
    `INNER JOIN public.${tableName} a ON`,
    '  a.picture_legacy_id = p2.id_legacy_ntb',
    'WHERE',
    '  p1.uuid = p2.uuid',
  ].join('\n');

  logger.info('Setting list uuid on pictures');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove pictures that used to belong to an list in legacy-ntb
 */
async function removeDepreactedListPictures(handler) {
  const { tableName } = handler.lists.TempListPicturesModel;
  const sql = [
    'DELETE FROM public.picture',
    'USING public.picture p2',
    `LEFT JOIN public.${tableName} te ON`,
    '  p2.id_legacy_ntb = te.picture_legacy_id',
    'WHERE',
    '  te.picture_legacy_id IS NULL AND',
    '  p2.list_uuid IS NOT NULL AND',
    '  p2.data_source = :data_source AND',
    '  public.picture.uuid = p2.uuid',
  ].join('\n');

  logger.info('Deleting deprecated list pictures');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
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

  // Set list UUIDs on TempListCabinPoi temp data
  sql = [
    `UPDATE public.${tableName} a1 SET`,
    '  list_uuid = c.uuid',
    `FROM public.${tableName} a2`,
    'INNER JOIN public.list c ON',
    '  c.id_legacy_ntb = a2.list_legacy_id',
    'WHERE',
    '  a1.document_legacy_id = a2.document_legacy_id AND',
    '  a1.list_legacy_id = a2.list_legacy_id',
  ].join('\n');

  logger.info('Update list uuids on list-relations temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Set cabin UUIDs on TempListCabinPoi temp data
  sql = [
    `UPDATE public.${tableName} a1 SET`,
    '  document_uuid = c.uuid,',
    '  document_type = \'cabin\'',
    `FROM public.${tableName} a2`,
    'INNER JOIN public.cabin c ON',
    '  c.id_legacy_ntb = a2.document_legacy_id',
    'WHERE',
    '  a1.document_legacy_id = a2.document_legacy_id AND',
    '  a1.list_legacy_id = a2.list_legacy_id',
  ].join('\n');

  logger.info('Update cabin uuids on list-relations temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Set poi UUIDs on TempListCabinPoi temp data
  sql = [
    `UPDATE public.${tableName} a1 SET`,
    '  document_uuid = c.uuid,',
    '  document_type = \'poi\'',
    `FROM public.${tableName} a2`,
    'INNER JOIN public.poi c ON',
    '  c.id_legacy_ntb = a2.document_legacy_id',
    'WHERE',
    '  a1.document_legacy_id = a2.document_legacy_id AND',
    '  a1.list_legacy_id = a2.list_legacy_id',
  ].join('\n');

  logger.info('Update poi uuids on list-relations temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);


  // Merge into prod table
  sql = [
    'INSERT INTO list_relation (',
    '  list_uuid,',
    '  document_type,',
    '  document_uuid,',
    '  sort_index,',
    '  data_source',
    ')',
    'SELECT',
    '  list_uuid,',
    '  document_type,',
    '  document_uuid,',
    '  sort_index,',
    '  :data_source',
    `FROM public.${tableName}`,
    'WHERE list_uuid IS NOT NULL AND document_uuid IS NOT NULL',
    'ON CONFLICT (list_uuid, document_type, document_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating list to group relations');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove list to group relations that no longer exist in legacy-ntb
 */
async function removeDepreactedListRelations(handler) {
  const { tableName } = handler.lists.TempListCabinPoi;

  const sql = [
    'DELETE FROM public.list_relation',
    'USING public.list_relation c2a',
    `LEFT JOIN public.${tableName} te ON`,
    '  c2a.list_uuid = te.list_uuid AND',
    '  c2a.document_uuid = te.document_uuid',
    'WHERE',
    '  te.document_uuid IS NULL AND',
    '  c2a.data_source = :data_source AND',
    '  public.list_relation.list_uuid = c2a.list_uuid AND',
    '  public.list_relation.document_uuid = c2a.document_uuid',
  ].join('\n');

  logger.info('Deleting deprecated list relations');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Mark lists that no longer exist in legacy-ntb as deleted
 */
async function removeDepreactedList(handler) {
  const { tableName } = handler.lists.TempListModel;
  const sql = [
    'UPDATE public.list a1 SET',
    '  status = :status',
    'FROM public.list a2',
    `LEFT JOIN public.${tableName} t ON`,
    '  t.id_legacy_ntb = a2.id_legacy_ntb',
    'WHERE',
    '  t.id_legacy_ntb IS NULL AND',
    '  a1.uuid = a2.uuid AND',
    '  a2.data_source = :data_source AND',
    '  a2.status != :status',
  ].join('\n');

  logger.info('Marking deprecated lists as deleted');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
      status: 'deleted',
    },
  });
  endDuration(durationId);
}


/**
 * Process legacy list data and merge it into the postgres database
 */
const process = async (handler, first = false) => {
  logger.info('Processing lists');
  handler.lists = {};

  await createTempTables(handler, false);
  await mergeList(handler);
  await mergeListLinks(handler);
  await removeDepreactedListLinks(handler);
  await mergeListToGroup(handler);
  await removeDepreactedListToGroup(handler);
  await setListPictures(handler);
  await removeDepreactedListPictures(handler);
  await mergeListRelation(handler);
  await removeDepreactedListRelations(handler);
  await removeDepreactedList(handler);
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

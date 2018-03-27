import moment from 'moment';

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

  const date = moment().format('YYYYMMDDHHmmssSSS');
  const baseTableName = `_temp_legacy_ntb_harvest_${date}`;

  handler.groups.TempGroupModel = db.sequelize.define(`${baseTableName}_g`, {
    uuid: { type: db.Sequelize.UUID, primaryKey: true },
    idLegacyNtb: { type: db.Sequelize.TEXT },
    groupType: { type: db.Sequelize.TEXT, allowNull: true },
    groupSubType: { type: db.Sequelize.TEXT, allowNull: true },
    name: { type: db.Sequelize.TEXT },
    nameLowerCase: { type: db.Sequelize.TEXT },
    description: { type: db.Sequelize.TEXT, allowNull: true },
    descriptionPlain: { type: db.Sequelize.TEXT, allowNull: true },
    logo: { type: db.Sequelize.TEXT, allowNull: true },
    organizationNumber: { type: db.Sequelize.TEXT, allowNull: true },
    url: { type: db.Sequelize.TEXT, allowNull: true },
    email: { type: db.Sequelize.TEXT, allowNull: true },
    phone: { type: db.Sequelize.TEXT, allowNull: true },
    mobile: { type: db.Sequelize.TEXT, allowNull: true },
    fax: { type: db.Sequelize.TEXT, allowNull: true },
    address1: { type: db.Sequelize.TEXT, allowNull: true },
    address2: { type: db.Sequelize.TEXT, allowNull: true },
    postalCode: { type: db.Sequelize.TEXT, allowNull: true },
    postalName: { type: db.Sequelize.TEXT, allowNull: true },
    license: { type: db.Sequelize.TEXT, allowNull: true },
    provider: { type: db.Sequelize.TEXT, allowNull: true },
    status: { type: db.Sequelize.TEXT },
    dataSource: { type: db.Sequelize.TEXT },
    updatedAt: { type: db.Sequelize.DATE },
    municipalityUuid: { type: db.Sequelize.UUID, allowNull: true },
  }, {
    timestamps: false,
    tableName: `${baseTableName}_g`,
  });
  await handler.groups.TempGroupModel.sync();

  handler.groups.TempGroupLinkModel =
    db.sequelize.define(`${baseTableName}_gl`, {
      uuid: { type: db.Sequelize.UUID, primaryKey: true },
      type: { type: db.Sequelize.TEXT },
      title: { type: db.Sequelize.TEXT, allowNull: true },
      url: { type: db.Sequelize.TEXT },
      groupUuid: { type: db.Sequelize.UUID, allowNull: true },
      idGroupLegacyNtb: { type: db.Sequelize.TEXT },
      sortIndex: { type: db.Sequelize.INTEGER },
      dataSource: { type: db.Sequelize.TEXT },
      updatedAt: { type: db.Sequelize.DATE },
    }, {
      timestamps: false,
      tableName: `${baseTableName}_gl`,
    });
  await handler.groups.TempGroupLinkModel.sync();

  endDuration(durationId);
}


/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  await handler.groups.TempGroupModel.drop();
  await handler.groups.TempGroupLinkModel.drop();

  endDuration(durationId);
}


/**
 * Send legacy ntb data through a mapper that converts old structure to new
 */
async function mapData(handler) {
  logger.info('Mapping legacy data to new structure');
  const durationId = startDuration();
  const groups = [];

  await Promise.all(handler.documents.grupper.map(async (d) => {
    const m = await legacy.grupper.mapping(d, handler);
    groups.push(m);
  }));
  endDuration(durationId);

  handler.groups.processed = groups;
}


/**
 * Populate temporary tables with the processed legacy ntb data
 */
async function populateTempTables(handler) {
  let durationId;

  logger.info('Inserting group to temporary table');
  durationId = startDuration();
  const groups = handler.groups.processed.map((p) => p.group);
  await handler.groups.TempGroupModel.bulkCreate(groups);
  endDuration(durationId);

  // Process data for links and tags
  let links = [];
  handler.groups.processed.forEach((p) => {
    links = links.concat(p.links);
  });

  // Insert temp data for GroupLink
  logger.info('Inserting group links to temporary table');
  durationId = startDuration();
  await handler.groups.TempGroupLinkModel.bulkCreate(links);
  endDuration(durationId);
}


/**
 * Create new group types
 */
async function createGroupTypes(handler) {
  const { tableName } = handler.groups.TempGroupModel;

  // Create primary group types
  let sql = [
    'INSERT INTO group_type (name)',
    'SELECT DISTINCT group_type',
    `FROM public.${tableName}`,
    'ON CONFLICT (name) DO NOTHING',
  ].join('\n');

  logger.info('Create new primary group types');
  let durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Create sub group types
  sql = [
    'INSERT INTO group_type (name, parent)',
    'SELECT DISTINCT group_sub_type, group_type',
    `FROM public.${tableName}`,
    'WHERE group_sub_type IS NOT NULL',
    'ON CONFLICT (name) DO NOTHING',
  ].join('\n');

  logger.info('Create new sub group types');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);
}


/**
 * Insert into `group`-table or update if it already exists
 */
async function mergeGroups(handler) {
  const sql = [
    'INSERT INTO public.group (',
    '  uuid,',
    '  id_legacy_ntb,',
    '  group_type,',
    '  group_sub_type,',
    '  name,',
    '  name_lower_case,',
    '  description,',
    '  description_plain,',
    '  logo,',
    '  organization_number,',
    '  url,',
    '  email,',
    '  phone,',
    '  mobile,',
    '  fax,',
    '  address_1,',
    '  address_2,',
    '  postal_code,',
    '  postal_name,',
    '  license,',
    '  provider,',
    '  status,',
    '  data_source,',
    '  created_at,',
    '  updated_at,',
    '  municipality_uuid,',
    '  search_document_boost',
    ')',
    'SELECT',
    '  uuid,',
    '  id_legacy_ntb,',
    '  group_type,',
    '  group_sub_type,',
    '  name,',
    '  name_lower_case,',
    '  description,',
    '  description_plain,',
    '  logo,',
    '  organization_number,',
    '  url,',
    '  email,',
    '  phone,',
    '  mobile,',
    '  fax,',
    '  address_1,',
    '  address_2,',
    '  postal_code,',
    '  postal_name,',
    '  license,',
    '  provider,',
    '   status::enum_group_status,',
    '  data_source,',
    '  updated_at,',
    '  updated_at,',
    '  municipality_uuid,',
    '  1',
    `FROM public.${handler.groups.TempGroupModel.tableName}`,
    'ON CONFLICT (id_legacy_ntb) DO UPDATE',
    'SET',
    '  group_type = EXCLUDED.group_type,',
    '  group_sub_type = EXCLUDED.group_sub_type,',
    '  name = EXCLUDED.name,',
    '  name_lower_case = EXCLUDED.name_lower_case,',
    '  description = EXCLUDED.description,',
    '  description_plain = EXCLUDED.description_plain,',
    '  logo = EXCLUDED.logo,',
    '  organization_number = EXCLUDED.organization_number,',
    '  url = EXCLUDED.url,',
    '  email = EXCLUDED.email,',
    '  phone = EXCLUDED.phone,',
    '  mobile = EXCLUDED.mobile,',
    '  fax = EXCLUDED.fax,',
    '  address_1 = EXCLUDED.address_1,',
    '  address_2 = EXCLUDED.address_2,',
    '  postal_code = EXCLUDED.postal_code,',
    '  postal_name = EXCLUDED.postal_name,',
    '  license = EXCLUDED.license,',
    '  provider = EXCLUDED.provider,',
    '  status = EXCLUDED.status,',
    '  updated_at = EXCLUDED.updated_at,',
    '  municipality_uuid = EXCLUDED.municipality_uuid',
  ].join('\n');

  logger.info('Creating or updating groups');
  const durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);
}


/**
 * Insert into `group_link`-table or update if it already exists
 */
async function mergeGroupLinks(handler) {
  let sql;
  let durationId;

  // Set UUIDs on groupLink temp data
  sql = [
    `UPDATE public.${handler.groups.TempGroupLinkModel.tableName} gl1 SET`,
    '  group_uuid = g.uuid',
    `FROM public.${handler.groups.TempGroupLinkModel.tableName} gl2`,
    'INNER JOIN public.group g ON',
    '  g.id_legacy_ntb = gl2.id_group_legacy_ntb',
    'WHERE',
    '  gl1.id_group_legacy_ntb = gl2.id_group_legacy_ntb AND',
    '  gl1.sort_index = gl2.sort_index',
  ].join('\n');

  logger.info('Update uuids on group links temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO group_link (',
    '  uuid, group_uuid, type, title, url,',
    '  sort_index, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  uuid, group_uuid, type, title, url,',
    '  sort_index, :data_source, now(), now()',
    `FROM public.${handler.groups.TempGroupLinkModel.tableName}`,
    'ON CONFLICT (group_uuid, sort_index) DO UPDATE',
    'SET',
    '  type = EXCLUDED.type,',
    '  title = EXCLUDED.title,',
    '  url = EXCLUDED.url',
  ].join('\n');

  logger.info('Creating or updating group links');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove group links that no longer exist in legacy-ntb
 */
async function removeDepreactedGroupLinks(handler) {
  const sql = [
    'DELETE FROM public.group_link',
    'USING public.group_link gl',
    `LEFT JOIN public.${handler.groups.TempGroupLinkModel.tableName} te ON`,
    '  gl.group_uuid = te.group_uuid AND',
    '  gl.sort_index = te.sort_index',
    'WHERE',
    '  te.group_uuid IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.group_link.group_uuid = gl.group_uuid AND',
    '  public.group_link.sort_index = gl.sort_index',
  ].join('\n');

  logger.info('Deleting deprecated group links');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Mark groups that no longer exist in legacy-ntb as deleted
 */
async function removeDepreactedGroups(handler) {
  const { tableName } = handler.groups.TempGroupModel;
  const sql = [
    'UPDATE public.group g1 SET',
    '  status = :status',
    'FROM public.group g2',
    `LEFT JOIN public.${tableName} t ON`,
    '  t.id_legacy_ntb = g2.id_legacy_ntb',
    'WHERE',
    '  t.id_legacy_ntb IS NULL AND',
    '  g1.uuid = g2.uuid AND',
    '  g2.data_source = :data_source AND',
    '  g2.status != :status',
  ].join('\n');

  logger.info('Marking deprecated groups as deleted');
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
 * Process legacy group data and merge it into the postgres database
 */
const process = async (handler) => {
  logger.info('Processing groups');
  handler.groups = {};

  await mapData(handler);
  await createTempTables(handler);
  await populateTempTables(handler);
  await createGroupTypes(handler);
  await mergeGroups(handler);
  await mergeGroupLinks(handler);
  await removeDepreactedGroupLinks(handler);
  await removeDepreactedGroups(handler);
  await dropTempTables(handler);
};


export default process;

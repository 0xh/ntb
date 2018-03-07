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
    type: { type: db.Sequelize.TEXT, allowNull: true },
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
      idxGroupLegacyNtb: { type: db.Sequelize.INTEGER },
      dataSource: { type: db.Sequelize.TEXT },
      updatedAt: { type: db.Sequelize.DATE },
    }, {
      timestamps: false,
      tableName: `${baseTableName}_gl`,
    });
  await handler.groups.TempGroupLinkModel.sync();

  handler.groups.TempGroupTagModel =
    db.sequelize.define(`${baseTableName}_gt`, {
      name: { type: db.Sequelize.TEXT },
      nameLowerCase: { type: db.Sequelize.TEXT },
      idGroupLegacyNtb: { type: db.Sequelize.TEXT },
      groupUuid: { type: db.Sequelize.UUID },
    }, {
      timestamps: false,
      tableName: `${baseTableName}_gt`,
    });
  await handler.groups.TempGroupTagModel.sync();

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
  await handler.groups.TempGroupTagModel.drop();

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
  const tags = [];
  handler.groups.processed.forEach((p) => {
    links = links.concat(p.links);

    p.tags.forEach((tag) => tags.push({
      name: tag,
      nameLowerCase: tag.toLowerCase(),
      idGroupLegacyNtb: p.group.idLegacyNtb,
    }));
  });

  // Insert temp data for GroupLink
  logger.info('Inserting group links to temporary table');
  durationId = startDuration();
  await handler.groups.TempGroupLinkModel.bulkCreate(links);
  endDuration(durationId);

  // Insert temp data for GroupTag
  logger.info('Inserting group tags to temporary table');
  durationId = startDuration();
  await handler.groups.TempGroupTagModel.bulkCreate(tags);
  endDuration(durationId);
}

/**
 * Insert into `group`-table or update if it already exists
 */
async function mergeGroups(handler) {
  const sql = [
    'INSERT INTO public.group (',
    '  uuid, id_legacy_ntb, type, name, name_lower_case, description,',
    '  description_plain, logo, organization_number, url, email, phone,',
    '  mobile, fax, address_1, address_2, postal_code, postal_name, license,',
    '  provider, status, data_source, created_at, updated_at,',
    '  municipality_uuid',
    ')',
    'SELECT',
    '  uuid, id_legacy_ntb, type, name, name_lower_case, description,',
    '  description_plain, logo, organization_number, url, email, phone,',
    '  mobile, fax, address_1, address_2, postal_code, postal_name, license,',
    '  provider,  status::enum_group_status, data_source, updated_at,',
    '  updated_at, municipality_uuid',
    `FROM public.${handler.groups.TempGroupModel.tableName}`,
    'ON CONFLICT (id_legacy_ntb) DO UPDATE',
    'SET',
    '  type = EXCLUDED.type,',
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
    '  gl1.idx_group_legacy_ntb = gl2.idx_group_legacy_ntb',
  ].join('\n');

  logger.info('Update uuids on area-to-area temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO group_link (',
    '  uuid, group_uuid, type, title, url, id_group_legacy_ntb,',
    '  idx_group_legacy_ntb, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  uuid, group_uuid, type, title, url, id_group_legacy_ntb,',
    '  idx_group_legacy_ntb, :data_source, now(), now()',
    `FROM public.${handler.groups.TempGroupLinkModel.tableName}`,
    'ON CONFLICT (id_group_legacy_ntb, idx_group_legacy_ntb) DO UPDATE',
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
    '  gl.id_group_legacy_ntb = te.id_group_legacy_ntb AND',
    '  gl.idx_group_legacy_ntb = te.idx_group_legacy_ntb',
    'WHERE',
    '  te.id_group_legacy_ntb IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.group_link.id_group_legacy_ntb = gl.id_group_legacy_ntb AND',
    '  public.group_link.idx_group_legacy_ntb = gl.idx_group_legacy_ntb',
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
 * Create new tags
 */
async function createTags(handler) {
  const { tableName } = handler.groups.TempGroupTagModel;
  const sql = [
    'INSERT INTO tag (name_lower_case, name)',
    'SELECT DISTINCT name_lower_case, name',
    `FROM public.${tableName}`,
    'ON CONFLICT (name_lower_case) DO NOTHING',
  ].join('\n');

  logger.info('Create new tags');
  const durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);
}


/**
 * Create new tags
 */
async function createTagRelations(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.groups.TempGroupTagModel;

  // Set UUIDs on groupTag temp data
  sql = [
    `UPDATE public.${tableName} gt1 SET`,
    '  group_uuid = g.uuid',
    `FROM public.${tableName} gt2`,
    'INNER JOIN public.group g ON',
    '  g.id_legacy_ntb = gt2.id_group_legacy_ntb',
    'WHERE',
    '  gt1.id_group_legacy_ntb = gt2.id_group_legacy_ntb',
  ].join('\n');

  logger.info('Update uuids on group tag temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Create group tag relations
  sql = [
    'INSERT INTO tag_relation (',
    '  tag_name, tagged_type, tagged_uuid, data_source',
    ')',
    'SELECT',
    '  name_lower_case, :tagged_type, group_uuid, :data_source',
    `FROM public.${tableName}`,
    'ON CONFLICT (tag_name, tagged_type, tagged_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Create new group tag relations');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      tagged_type: 'group',
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove group tags that no longer exist in legacy-ntb
 */
async function removeDepreactedGroupTags(handler) {
  const { tableName } = handler.groups.TempGroupTagModel;
  const sql = [
    'DELETE FROM public.tag_relation',
    'USING public.tag_relation tr',
    `LEFT JOIN public.${tableName} te ON`,
    '  tr.tag_name = te.name_lower_case AND',
    '  tr.tagged_uuid = te.group_uuid',
    'WHERE',
    '  te.id_group_legacy_ntb IS NULL AND',
    '  tr.tagged_type = :tagged_type AND',
    '  tr.data_source = :data_source AND',
    '  public.tag_relation.tag_name = tr.tag_name AND',
    '  public.tag_relation.tagged_type = tr.tagged_type AND',
    '  public.tag_relation.tagged_uuid = tr.tagged_uuid',
  ].join('\n');

  logger.info('Deleting deprecated group links');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      tagged_type: 'group',
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
  await mergeGroups(handler);
  await mergeGroupLinks(handler);
  await removeDepreactedGroupLinks(handler);
  await createTags(handler);
  await createTagRelations(handler);
  await removeDepreactedGroupTags(handler);
  await removeDepreactedGroups(handler);
  await dropTempTables(handler);
};


export default process;

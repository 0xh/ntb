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
    descriptionWords: {
      type: db.Sequelize.ARRAY(db.Sequelize.TEXT),
      allowNull: true,
    },
    descriptionWordsStemmed: {
      type: db.Sequelize.ARRAY(db.Sequelize.TEXT),
      allowNull: true,
    },
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

  // Process data for links
  const links = [];
  handler.groups.processed.forEach((p) => {
    p.links.forEach((link) => links.push(link));
  });

  // Insert temp data for GroupLink
  logger.info('Inserting group links to temporary table');
  durationId = startDuration();
  await handler.groups.TempGroupLinkModel.bulkCreate(links);
  endDuration(durationId);
}

/**
 * Insert into `group`-table or update if it already exists
 */
async function mergeGroups(handler) {
  const sql = [
    'INSERT INTO public.group (',
    '  uuid, id_legacy_ntb, type, name, name_lower_case, description,',
    '  description_plain, description_words, description_words_stemmed,',
    '  logo, organization_number, url, email, phone, mobile, fax,',
    '  address_1, address_2, postal_code, postal_name, license, provider,',
    '  status, data_source, created_at, updated_at, municipality_uuid',
    ')',
    'SELECT',
    '  uuid, id_legacy_ntb, type, name, name_lower_case, description,',
    '  description_plain, description_words, description_words_stemmed,',
    '  logo, organization_number, url, email, phone, mobile, fax,',
    '  address_1, address_2, postal_code, postal_name, license, provider,',
    '  status::enum_group_status, data_source, updated_at, updated_at,',
    '  municipality_uuid',
    `FROM public.${handler.groups.TempGroupModel.tableName}`,
    'ON CONFLICT (id_legacy_ntb) DO UPDATE',
    'SET',
    '  type = EXCLUDED.type,',
    '  name = EXCLUDED.name,',
    '  name_lower_case = EXCLUDED.name_lower_case,',
    '  description = EXCLUDED.description,',
    '  description_plain = EXCLUDED.description_plain,',
    '  description_words = EXCLUDED.description_words,',
    '  description_words_stemmed = EXCLUDED.description_words_stemmed,',
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
 * Process legacy area data and merge it into the postgres database
 */
const process = async (handler) => {
  logger.info('Processing groups');
  handler.groups = {};


  await mapData(handler);
  await createTempTables(handler);
  await populateTempTables(handler);
  await mergeGroups(handler);
  await mergeGroupLinks(handler);
  // await removeDepreactedAreaToArea(handler);
  // await mergeAreaToCounty(handler);
  // await removeDepreactedAreaToCounty(handler);
  // await mergeAreaToMunicipality(handler);
  // await removeDepreactedAreaToMunicipality(handler);
  // await removeDepreactedArea(handler);
  // await dropTempTables(handler);
};


export default process;

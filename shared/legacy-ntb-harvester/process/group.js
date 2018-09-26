import { knex, Model } from '@ntb/db-utils';
import {
  Logger,
  startDuration,
  printDuration,
} from '@ntb/utils';

import * as legacy from '../legacy-structure/';


const logger = Logger.getLogger();
const DATASOURCE_NAME = 'legacy-ntb';


/**
 * Create temporary tables that will hold the processed data harvested from
 * legacy-ntb
 */
async function createTempTables(handler, first = false) {
  logger.info('Creating temporary tables');
  const durationId = startDuration();

  const baseTableName = `0_${handler.timeStamp}_harlegntb`;

  let tableName = `${baseTableName}_groups`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('id')
        .primary();
      table.text('idLegacyNtb');
      table.text('groupType');
      table.text('groupSubType');
      table.text('name');
      table.text('nameLowerCase');
      table.text('description');
      table.text('descriptionPlain');
      table.text('logo');
      table.text('organizationNumber');
      table.text('url');
      table.text('email');
      table.text('phone');
      table.text('mobile');
      table.text('fax');
      table.text('address1');
      table.text('address2');
      table.text('postalCode');
      table.text('postalName');
      table.text('license');
      table.text('provider');
      table.text('status');
      table.text('dataSource');
      table.timestamp('updatedAt');
      table.uuid('municipalityId');
    });
  }

  class TempGroupModel extends Model {
    static tableName = tableName;
  }
  handler.groups.TempGroupModel = TempGroupModel;


  tableName = `${baseTableName}_grouplinks`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('id')
        .primary();
      table.text('type');
      table.text('title');
      table.text('url');
      table.uuid('groupId');
      table.text('idGroupLegacyNtb');
      table.integer('sortIndex');
      table.text('dataSource');
      table.timestamp('updatedAt');
    });
  }

  class TempGroupLinkModel extends Model {
    static tableName = tableName;
  }
  handler.groups.TempGroupLinkModel = TempGroupLinkModel;

  printDuration(durationId);
}


/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  await knex.schema
    .dropTableIfExists(handler.groups.TempGroupModel.tableName)
    .dropTableIfExists(handler.groups.TempGroupLinkModel.tableName);

  printDuration(durationId);
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
  printDuration(durationId);

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
  await handler.groups.TempGroupModel
    .query()
    .insert(groups);
  printDuration(durationId);

  // Process data for links and tags
  let links = [];
  handler.groups.processed.forEach((p) => {
    links = links.concat(p.links);
  });

  // Insert temp data for GroupLink
  logger.info('Inserting group links to temporary table');
  durationId = startDuration();
  await handler.groups.TempGroupLinkModel
    .query()
    .insert(links);
  printDuration(durationId);
}


/**
 * Create new group types
 */
async function createGroupTypes(handler) {
  const { tableName } = handler.groups.TempGroupModel;

  // Create primary group types
  let sql = [
    'INSERT INTO group_types (name)',
    'SELECT DISTINCT group_type',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (name) DO NOTHING',
  ].join('\n');

  logger.info('Create new primary group types');
  let durationId = startDuration();
  await knex.raw(sql);
  printDuration(durationId);

  // Create sub group types
  sql = [
    'INSERT INTO group_types (name, parent)',
    'SELECT DISTINCT group_sub_type, group_type',
    `FROM "public"."${tableName}"`,
    'WHERE group_sub_type IS NOT NULL',
    'ON CONFLICT (name) DO NOTHING',
  ].join('\n');

  logger.info('Create new sub group types');
  durationId = startDuration();
  await knex.raw(sql);
  printDuration(durationId);
}


/**
 * Insert into `group`-table or update if it already exists
 */
async function mergeGroups(handler) {
  const sql = [
    'INSERT INTO public.groups (',
    '  id,',
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
    '  municipality_id,',
    '  search_document_boost',
    ')',
    'SELECT',
    '  id,',
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
    '  updated_at,',
    '  updated_at,',
    '  municipality_id,',
    '  100',
    `FROM public."${handler.groups.TempGroupModel.tableName}"`,
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
    '  municipality_id = EXCLUDED.municipality_id',
  ].join('\n');

  logger.info('Creating or updating groups');
  const durationId = startDuration();
  await knex.raw(sql);
  printDuration(durationId);
}


/**
 * Insert into `group_link`-table or update if it already exists
 */
async function mergeGroupLinks(handler) {
  let sql;
  let durationId;

  // Set UUIDs on groupLink temp data
  sql = [
    `UPDATE public."${handler.groups.TempGroupLinkModel.tableName}" gl1 SET`,
    '  group_id = g.id',
    `FROM public."${handler.groups.TempGroupLinkModel.tableName}" gl2`,
    'INNER JOIN public.groups g ON',
    '  g.id_legacy_ntb = gl2.id_group_legacy_ntb',
    'WHERE',
    '  gl1.id_group_legacy_ntb = gl2.id_group_legacy_ntb AND',
    '  gl1.sort_index = gl2.sort_index',
  ].join('\n');

  logger.info('Update ids on group links temp data');
  durationId = startDuration();
  await knex.raw(sql);
  printDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO group_links (',
    '  id, group_id, type, title, url,',
    '  sort_index, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  id, group_id, type, title, url,',
    '  sort_index, :data_source, now(), now()',
    `FROM public."${handler.groups.TempGroupLinkModel.tableName}"`,
    'ON CONFLICT (group_id, sort_index) DO UPDATE',
    'SET',
    '  type = EXCLUDED.type,',
    '  title = EXCLUDED.title,',
    '  url = EXCLUDED.url',
  ].join('\n');

  logger.info('Creating or updating group links');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  printDuration(durationId);
}


/**
 * Remove group links that no longer exist in legacy-ntb
 */
async function removeDepreactedGroupLinks(handler) {
  const sql = [
    'DELETE FROM public.group_links',
    'USING public.group_links gl',
    `LEFT JOIN public."${handler.groups.TempGroupLinkModel.tableName}" te ON`,
    '  gl.group_id = te.group_id AND',
    '  gl.sort_index = te.sort_index',
    'WHERE',
    '  te.group_id IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.group_links.group_id = gl.group_id AND',
    '  public.group_links.sort_index = gl.sort_index',
  ].join('\n');

  logger.info('Deleting deprecated group links');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  printDuration(durationId);
}


/**
 * Mark groups that no longer exist in legacy-ntb as deleted
 */
async function removeDepreactedGroups(handler) {
  const { tableName } = handler.groups.TempGroupModel;
  const sql = [
    'UPDATE public.groups g1 SET',
    '  status = :status',
    'FROM public.groups g2',
    `LEFT JOIN "public"."${tableName}" t ON`,
    '  t.id_legacy_ntb = g2.id_legacy_ntb',
    'WHERE',
    '  t.id_legacy_ntb IS NULL AND',
    '  g1.id = g2.id AND',
    '  g2.data_source = :data_source AND',
    '  g2.status != :status',
  ].join('\n');

  logger.info('Marking deprecated groups as deleted');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
    status: 'deleted',
  });
  printDuration(durationId);
}


/**
 * Process legacy group data and merge it into the postgres database
 */
const process = async (handler, fullHarvest = false) => {
  logger.info('Processing groups');
  handler.groups = {};

  await createTempTables(handler, false);
  await createGroupTypes(handler);
  await mergeGroups(handler);
  await mergeGroupLinks(handler);
  if (fullHarvest) await removeDepreactedGroupLinks(handler);
  if (fullHarvest) await removeDepreactedGroups(handler);
  await dropTempTables(handler);
};


/**
 * Map group data
 */
export const mapGroupData = async (handler, first = false) => {
  logger.info('Mapping groups');
  handler.groups = {};

  await mapData(handler);
  await createTempTables(handler, first);
  await populateTempTables(handler);
};


export default process;

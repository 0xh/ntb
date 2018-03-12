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

  let tableName = `${baseTableName}_cabin`;
  handler.cabins.TempCabinModel = db.sequelize.define(tableName, {
    uuid: { type: db.Sequelize.UUID, primaryKey: true },
    idLegacyNtb: { type: db.Sequelize.TEXT },

    dntCabin: { type: db.Sequelize.BOOLEAN },
    dntDiscount: { type: db.Sequelize.BOOLEAN },

    maintainerIdGroupLegacyNtb: { type: db.Sequelize.TEXT },
    maintainerGroupUuid: { type: db.Sequelize.UUID },
    ownerIdGroupLegacyNtb: { type: db.Sequelize.TEXT },
    ownerGroupUuid: { type: db.Sequelize.UUID },
    contactIdGroupLegacyNtb: { type: db.Sequelize.TEXT },
    contactGroupUuid: { type: db.Sequelize.UUID },

    name: { type: db.Sequelize.TEXT },
    nameLowerCase: { type: db.Sequelize.TEXT },
    nameAlt: { type: db.Sequelize.ARRAY(db.Sequelize.TEXT) },
    nameAltLowerCase: { type: db.Sequelize.ARRAY(db.Sequelize.TEXT) },
    description: { type: db.Sequelize.TEXT },
    descriptionPlain: { type: db.Sequelize.TEXT },

    contactName: { type: db.Sequelize.TEXT },
    email: { type: db.Sequelize.TEXT },
    phone: { type: db.Sequelize.TEXT },
    mobile: { type: db.Sequelize.TEXT },
    fax: { type: db.Sequelize.TEXT },
    address1: { type: db.Sequelize.TEXT },
    address2: { type: db.Sequelize.TEXT },
    postalCode: { type: db.Sequelize.TEXT },
    postalName: { type: db.Sequelize.TEXT },

    url: { type: db.Sequelize.TEXT },
    yearOfConstruction: { type: db.Sequelize.INTEGER },
    geojson: { type: db.Sequelize.GEOMETRY },
    countyUuid: { type: db.Sequelize.UUID },
    municipalityUuid: { type: db.Sequelize.UUID },
    serviceLevel: { type: db.Sequelize.TEXT },

    bedsExtra: { type: db.Sequelize.INTEGER },
    bedsServiced: { type: db.Sequelize.INTEGER },
    bedsSelfService: { type: db.Sequelize.INTEGER },
    bedsUnmanned: { type: db.Sequelize.INTEGER },
    bedsWinter: { type: db.Sequelize.INTEGER },

    bookingEnabled: { type: db.Sequelize.BOOLEAN },
    bookingOnly: { type: db.Sequelize.BOOLEAN },
    bookingUrl: { type: db.Sequelize.TEXT },

    htgtWinter: { type: db.Sequelize.TEXT },
    htgtSummer: { type: db.Sequelize.TEXT },
    htgtOtherWinter: { type: db.Sequelize.TEXT },
    htgtOtherSummer: { type: db.Sequelize.TEXT },

    map: { type: db.Sequelize.TEXT },
    mapAlt: { type: db.Sequelize.ARRAY(db.Sequelize.TEXT) },

    license: { type: db.Sequelize.TEXT },
    provider: { type: db.Sequelize.TEXT },
    status: { type: db.Sequelize.TEXT },
    dataSource: { type: db.Sequelize.TEXT },
    updatedAt: { type: db.Sequelize.DATE },
  }, {
    timestamps: false,
    tableName,
  });
  await handler.cabins.TempCabinModel.sync();

  tableName = `${baseTableName}_cabin_translation`;
  handler.cabins.TempTranslationModel = db.sequelize.define(tableName, {
    uuid: { type: db.Sequelize.UUID, primaryKey: true },
    cabinUuid: { type: db.Sequelize.UUID },
    cabinIdLegacyNtb: { type: db.Sequelize.TEXT },
    name: { type: db.Sequelize.TEXT },
    nameLowerCase: { type: db.Sequelize.TEXT },
    description: { type: db.Sequelize.TEXT },
    descriptionPlain: { type: db.Sequelize.TEXT },
    language: { type: db.Sequelize.TEXT },
  }, {
    timestamps: false,
    tableName,
  });
  await handler.cabins.TempTranslationModel.sync();

  tableName = `${baseTableName}_cabin_links`;
  handler.cabins.TempCabinLinkModel =
    db.sequelize.define(tableName, {
      uuid: { type: db.Sequelize.UUID, primaryKey: true },
      type: { type: db.Sequelize.TEXT },
      title: { type: db.Sequelize.TEXT, allowNull: true },
      url: { type: db.Sequelize.TEXT },
      cabinUuid: { type: db.Sequelize.UUID, allowNull: true },
      idCabinLegacyNtb: { type: db.Sequelize.TEXT },
      idxCabinLegacyNtb: { type: db.Sequelize.INTEGER },
      dataSource: { type: db.Sequelize.TEXT },
      updatedAt: { type: db.Sequelize.DATE },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.cabins.TempCabinLinkModel.sync();

  tableName = `${baseTableName}_cabin_tags`;
  handler.cabins.TempCabinTagModel =
    db.sequelize.define(tableName, {
      name: { type: db.Sequelize.TEXT },
      nameLowerCase: { type: db.Sequelize.TEXT },
      idCabinLegacyNtb: { type: db.Sequelize.TEXT },
      cabinUuid: { type: db.Sequelize.UUID },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.cabins.TempCabinTagModel.sync();

  tableName = `${baseTableName}_cabin_facility`;
  handler.cabins.TempFacilityModel =
    db.sequelize.define(tableName, {
      name: { type: db.Sequelize.TEXT },
      nameLowerCase: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.cabins.TempFacilityModel.sync();

  tableName = `${baseTableName}_cabin_facilities`;
  handler.cabins.TempCabinFacilityModel =
    db.sequelize.define(tableName, {
      nameLowerCase: { type: db.Sequelize.TEXT },
      idCabinLegacyNtb: { type: db.Sequelize.TEXT },
      cabinUuid: { type: db.Sequelize.UUID },
      description: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.cabins.TempCabinFacilityModel.sync();

  tableName = `${baseTableName}_cabin_accessability`;
  handler.cabins.TempAccessabilityModel =
    db.sequelize.define(tableName, {
      name: { type: db.Sequelize.TEXT },
      nameLowerCase: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.cabins.TempAccessabilityModel.sync();

  tableName = `${baseTableName}_cabin_accessabilities`;
  handler.cabins.TempCabinAccessabilityModel =
    db.sequelize.define(tableName, {
      nameLowerCase: { type: db.Sequelize.TEXT },
      idCabinLegacyNtb: { type: db.Sequelize.TEXT },
      cabinUuid: { type: db.Sequelize.UUID },
      description: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.cabins.TempCabinAccessabilityModel.sync();

  endDuration(durationId);
}

/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  await handler.cabins.TempCabinModel.drop();
  await handler.cabins.TempTranslationModel.drop();
  await handler.cabins.TempCabinLinkModel.drop();
  await handler.cabins.TempCabinTagModel.drop();
  await handler.cabins.TempFacilityModel.drop();
  await handler.cabins.TempCabinFacilityModel.drop();
  await handler.cabins.TempAccessabilityModel.drop();
  await handler.cabins.TempCabinAccessabilityModel.drop();

  endDuration(durationId);
}


/**
 * Send legacy ntb data through a mapper that converts old structure to new
 */
async function mapData(handler) {
  logger.info('Mapping legacy data to new structure');
  const durationId = startDuration();
  const cabins = [];

  await Promise.all(
    handler.documents.steder
      .filter((d) => d.tags && d.tags[0] === 'Hytte')
      .map(async (d) => {
        const m = await legacy.hytter.mapping(d, handler);
        cabins.push(m);
      })
  );
  endDuration(durationId);

  handler.cabins.processed = cabins;
}


/**
 * Populate temporary tables with the processed legacy ntb data
 */
async function populateTempTables(handler) {
  let durationId;

  logger.info('Inserting cabins to temporary table');
  durationId = startDuration();
  const cabins = handler.cabins.processed.map((p) => p.cabin);
  await handler.cabins.TempCabinModel.bulkCreate(cabins);
  endDuration(durationId);


  const translations = [];
  const tags = [];
  const facilities = [];
  const cabinFacilities = [];
  const accessabilities = [];
  const cabinAccessabilities = [];
  let links = [];
  handler.cabins.processed.forEach((p) => {
    if (p.english) {
      translations.push(p.english);
    }

    links = links.concat(p.links);

    if (p.tags) {
      p.tags.forEach((tag) => tags.push({
        name: tag,
        nameLowerCase: tag.toLowerCase(),
        idCabinLegacyNtb: p.cabin.idLegacyNtb,
      }));
    }

    if (p.facilities) {
      p.facilities.forEach((facility) => facilities.push({
        name: facility.name,
        nameLowerCase: facility.nameLowerCase,
      }));

      p.facilities.forEach((facility) => cabinFacilities.push({
        name: facility.name,
        nameLowerCase: facility.nameLowerCase,
        idCabinLegacyNtb: p.cabin.idLegacyNtb,
        description: facility.description,
      }));
    }

    if (p.accessibility) {
      p.accessibility.forEach((accessability) => accessabilities.push({
        name: accessability.name,
        nameLowerCase: accessability.nameLowerCase,
      }));

      p.accessibility.forEach((accessability) => cabinAccessabilities.push({
        name: accessability.name,
        nameLowerCase: accessability.nameLowerCase,
        idCabinLegacyNtb: p.cabin.idLegacyNtb,
        description: accessability.description,
      }));
    }
  });

  // Insert temp data for CabinTranslation
  logger.info('Inserting area county to temporary table');
  durationId = startDuration();
  await handler.cabins.TempTranslationModel.bulkCreate(translations);
  endDuration(durationId);

  // Insert temp data for CabinLink
  logger.info('Inserting cabin links to temporary table');
  durationId = startDuration();
  await handler.cabins.TempCabinLinkModel.bulkCreate(links);
  endDuration(durationId);

  // Insert temp data for CabinTag
  logger.info('Inserting cabin tags to temporary table');
  durationId = startDuration();
  await handler.cabins.TempCabinTagModel.bulkCreate(tags);
  endDuration(durationId);

  // Insert temp data for Facility
  logger.info('Inserting facilities to temporary table');
  durationId = startDuration();
  await handler.cabins.TempFacilityModel.bulkCreate(facilities);
  endDuration(durationId);

  // Insert temp data for CabinFacility
  logger.info('Inserting cabin facilities to temporary table');
  durationId = startDuration();
  await handler.cabins.TempCabinFacilityModel.bulkCreate(cabinFacilities);
  endDuration(durationId);

  // Insert temp data for Accessability
  logger.info('Inserting accessabilities to temporary table');
  durationId = startDuration();
  await handler.cabins.TempAccessabilityModel.bulkCreate(accessabilities);
  endDuration(durationId);

  // Insert temp data for CabinAccessability
  logger.info('Inserting cabin accessabilities to temporary table');
  durationId = startDuration();
  await handler.cabins.TempCabinAccessabilityModel.bulkCreate(
    cabinAccessabilities
  );
  endDuration(durationId);
}


/**
 * Insert into `cabin`-table or update if it already exists
 */
async function mergeCabin(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.cabins.TempCabinModel;

  // Set UUIDs on maintainer group on cabin temp data
  sql = [
    `UPDATE public.${tableName} c1 SET`,
    '  maintainer_group_uuid = g1.uuid',
    `FROM public.${tableName} c2`,
    'INNER JOIN public."group" g1 ON',
    '  g1.id_legacy_ntb = c2.maintainer_id_group_legacy_ntb',
    'WHERE',
    '  c1.id_legacy_ntb = c2.id_legacy_ntb',
  ].join('\n');

  logger.info('Update uuids on cabin maintainer temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Set UUIDs on owner group on cabin temp data
  sql = [
    `UPDATE public.${tableName} c1 SET`,
    '  owner_group_uuid = g1.uuid',
    `FROM public.${tableName} c2`,
    'INNER JOIN public."group" g1 ON',
    '  g1.id_legacy_ntb = c2.owner_id_group_legacy_ntb',
    'WHERE',
    '  c1.id_legacy_ntb = c2.id_legacy_ntb',
  ].join('\n');

  logger.info('Update uuids on cabin owner temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Set UUIDs on contact group on cabin temp data
  sql = [
    `UPDATE public.${tableName} c1 SET`,
    '  contact_group_uuid = g1.uuid',
    `FROM public.${tableName} c2`,
    'INNER JOIN public."group" g1 ON',
    '  g1.id_legacy_ntb = c2.contact_id_group_legacy_ntb',
    'WHERE',
    '  c1.id_legacy_ntb = c2.id_legacy_ntb',
  ].join('\n');

  logger.info('Update uuids on cabin contact temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO cabin (',
    '  uuid, id_legacy_ntb, dnt_cabin, dnt_discount, maintainer_group_uuid,',
    '  owner_group_uuid, contact_group_uuid, name, name_lower_case, name_alt,',
    '  name_alt_lower_case, description, description_plain, contact_name,',
    '  email, phone, mobile, fax, address_1, address_2, postal_code,',
    '  postal_name, url, year_of_construction, geojson, county_uuid,',
    '  municipality_uuid, service_level, beds_extra, beds_serviced,',
    '  beds_self_service, beds_unmanned, beds_winter, booking_enabled,',
    '  booking_only, booking_url, htgt_winter, htgt_summer,',
    '  htgt_other_winter, htgt_other_summer, map, map_alt, license,',
    '  provider, status, data_source, updated_at, created_at,',
    '  search_document_boost',
    ')',
    'SELECT',
    '  uuid, id_legacy_ntb, dnt_cabin, dnt_discount, maintainer_group_uuid,',
    '  owner_group_uuid, contact_group_uuid, name, name_lower_case, name_alt,',
    '  name_alt_lower_case, description, description_plain, contact_name,',
    '  email, phone, mobile, fax, address_1, address_2, postal_code,',
    '  postal_name, url, year_of_construction, geojson, county_uuid,',
    '  municipality_uuid, service_level::enum_cabin_service_level,',
    '  beds_extra, beds_serviced, beds_self_service, beds_unmanned,',
    '  beds_winter, booking_enabled, booking_only, booking_url, htgt_winter,',
    '  htgt_summer, htgt_other_winter, htgt_other_summer, map, map_alt,',
    '  license, provider, status::enum_cabin_status, :data_source,',
    '  updated_at, updated_at, 1',
    `FROM public.${tableName}`,
    'ON CONFLICT (id_legacy_ntb) DO UPDATE',
    'SET',
    '   dnt_cabin = EXCLUDED.dnt_cabin,',
    '   dnt_discount = EXCLUDED.dnt_discount,',
    '   maintainer_group_uuid = EXCLUDED.maintainer_group_uuid,',
    '   owner_group_uuid = EXCLUDED.owner_group_uuid,',
    '   contact_group_uuid = EXCLUDED.contact_group_uuid,',
    '   name = EXCLUDED.name,',
    '   name_lower_case = EXCLUDED.name_lower_case,',
    '   name_alt = EXCLUDED.name_alt,',
    '   name_alt_lower_case = EXCLUDED.name_alt_lower_case,',
    '   description = EXCLUDED.description,',
    '   description_plain = EXCLUDED.description_plain,',
    '   contact_name = EXCLUDED.contact_name,',
    '   email = EXCLUDED.email,',
    '   phone = EXCLUDED.phone,',
    '   mobile = EXCLUDED.mobile,',
    '   fax = EXCLUDED.fax,',
    '   address_1 = EXCLUDED.address_1,',
    '   address_2 = EXCLUDED.address_2,',
    '   postal_code = EXCLUDED.postal_code,',
    '   postal_name = EXCLUDED.postal_name,',
    '   url = EXCLUDED.url,',
    '   year_of_construction = EXCLUDED.year_of_construction,',
    '   geojson = EXCLUDED.geojson,',
    '   county_uuid = EXCLUDED.county_uuid,',
    '   municipality_uuid = EXCLUDED.municipality_uuid,',
    '   service_level = EXCLUDED.service_level,',
    '   beds_extra = EXCLUDED.beds_extra,',
    '   beds_serviced = EXCLUDED.beds_serviced,',
    '   beds_self_service = EXCLUDED.beds_self_service,',
    '   beds_unmanned = EXCLUDED.beds_unmanned,',
    '   beds_winter = EXCLUDED.beds_winter,',
    '   booking_enabled = EXCLUDED.booking_enabled,',
    '   booking_only = EXCLUDED.booking_only,',
    '   booking_url = EXCLUDED.booking_url,',
    '   htgt_winter = EXCLUDED.htgt_winter,',
    '   htgt_summer = EXCLUDED.htgt_summer,',
    '   htgt_other_winter = EXCLUDED.htgt_other_winter,',
    '   htgt_other_summer = EXCLUDED.htgt_other_summer,',
    '   map = EXCLUDED.map,',
    '   map_alt = EXCLUDED.map_alt,',
    '   license = EXCLUDED.license,',
    '   provider = EXCLUDED.provider,',
    '   status = EXCLUDED.status,',
    '   data_source = EXCLUDED.data_source,',
    '   updated_at = EXCLUDED.updated_at',
  ].join('\n');

  logger.info('Creating or updating cabins');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Insert into `cabin_translation`-table or update if it already exists
 */
async function mergeCabinTranslation(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.cabins.TempTranslationModel;

  // Set UUIDs on cabin in translation temp data
  sql = [
    `UPDATE public.${tableName} t1 SET`,
    '  cabin_uuid = c.uuid',
    `FROM public.${tableName} t2`,
    'INNER JOIN "public"."cabin" c ON',
    '  c.id_legacy_ntb = t2.cabin_id_legacy_ntb',
    'WHERE',
    '  t1.cabin_id_legacy_ntb = t2.cabin_id_legacy_ntb AND',
    '  t1.language = t2.language',
  ].join('\n');

  logger.info('Update uuids on cabin in translation temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO cabin_translation (',
    '  uuid, cabin_uuid, name, name_lower_case, description,',
    '  description_plain, language, data_source, updated_at, created_at',
    ')',
    'SELECT',
    '  uuid, cabin_uuid, name, name_lower_case, description,',
    '  description_plain, language, :data_source, now(), now()',
    `FROM public.${tableName}`,
    'ON CONFLICT (cabin_uuid, language) DO UPDATE',
    'SET',
    '   name = EXCLUDED.name,',
    '   name_lower_case = EXCLUDED.name_lower_case,',
    '   description = EXCLUDED.description,',
    '   description_plain = EXCLUDED.description_plain',
  ].join('\n');

  logger.info('Creating or updating cabins');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Insert into `CABIN_link`-table or update if it already exists
 */
async function mergeCabinLinks(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.cabins.TempCabinLinkModel;

  // Set UUIDs on cabinLink temp data
  sql = [
    `UPDATE public.${tableName} gl1 SET`,
    '  cabin_uuid = g.uuid',
    `FROM public.${tableName} gl2`,
    'INNER JOIN public.cabin g ON',
    '  g.id_legacy_ntb = gl2.id_cabin_legacy_ntb',
    'WHERE',
    '  gl1.id_cabin_legacy_ntb = gl2.id_cabin_legacy_ntb AND',
    '  gl1.idx_cabin_legacy_ntb = gl2.idx_cabin_legacy_ntb',
  ].join('\n');

  logger.info('Update uuids on cabin links temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO cabin_link (',
    '  uuid, cabin_uuid, type, title, url, id_cabin_legacy_ntb,',
    '  idx_cabin_legacy_ntb, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  uuid, cabin_uuid, type, title, url, id_cabin_legacy_ntb,',
    '  idx_cabin_legacy_ntb, :data_source, now(), now()',
    `FROM public.${tableName}`,
    'ON CONFLICT (id_cabin_legacy_ntb, idx_cabin_legacy_ntb) DO UPDATE',
    'SET',
    '  type = EXCLUDED.type,',
    '  title = EXCLUDED.title,',
    '  url = EXCLUDED.url',
  ].join('\n');

  logger.info('Creating or updating cabin links');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove cabin links that no longer exist in legacy-ntb
 */
async function removeDepreactedCabinLinks(handler) {
  const { tableName } = handler.cabins.TempCabinLinkModel;
  const sql = [
    'DELETE FROM public.cabin_link',
    'USING public.cabin_link gl',
    `LEFT JOIN public.${tableName} te ON`,
    '  gl.id_cabin_legacy_ntb = te.id_cabin_legacy_ntb AND',
    '  gl.idx_cabin_legacy_ntb = te.idx_cabin_legacy_ntb',
    'WHERE',
    '  te.id_cabin_legacy_ntb IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.cabin_link.id_cabin_legacy_ntb = gl.id_cabin_legacy_ntb AND',
    '  public.cabin_link.idx_cabin_legacy_ntb = gl.idx_cabin_legacy_ntb',
  ].join('\n');

  logger.info('Deleting deprecated cabin links');
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
  const { tableName } = handler.cabins.TempCabinTagModel;
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
 * Create new tag relations
 */
async function createTagRelations(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.cabins.TempCabinTagModel;

  // Set UUIDs on cabinTag temp data
  sql = [
    `UPDATE public.${tableName} gt1 SET`,
    '  cabin_uuid = g.uuid',
    `FROM public.${tableName} gt2`,
    'INNER JOIN public.cabin g ON',
    '  g.id_legacy_ntb = gt2.id_cabin_legacy_ntb',
    'WHERE',
    '  gt1.id_cabin_legacy_ntb = gt2.id_cabin_legacy_ntb',
  ].join('\n');

  logger.info('Update uuids on cabin tag temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Create cabin tag relations
  sql = [
    'INSERT INTO tag_relation (',
    '  tag_name, tagged_type, tagged_uuid, data_source',
    ')',
    'SELECT',
    '  name_lower_case, :tagged_type, cabin_uuid, :data_source',
    `FROM public.${tableName}`,
    'ON CONFLICT (tag_name, tagged_type, tagged_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Create new cabin tag relations');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      tagged_type: 'cabin',
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove cabin tags that no longer exist in legacy-ntb
 */
async function removeDepreactedCabinTags(handler) {
  const { tableName } = handler.cabins.TempCabinTagModel;
  const sql = [
    'DELETE FROM public.tag_relation',
    'USING public.tag_relation tr',
    `LEFT JOIN public.${tableName} te ON`,
    '  tr.tag_name = te.name_lower_case AND',
    '  tr.tagged_uuid = te.cabin_uuid',
    'WHERE',
    '  te.id_cabin_legacy_ntb IS NULL AND',
    '  tr.tagged_type = :tagged_type AND',
    '  tr.data_source = :data_source AND',
    '  public.tag_relation.tag_name = tr.tag_name AND',
    '  public.tag_relation.tagged_type = tr.tagged_type AND',
    '  public.tag_relation.tagged_uuid = tr.tagged_uuid',
  ].join('\n');

  logger.info('Deleting deprecated cabin links');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      tagged_type: 'cabin',
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Create new facilities
 */
async function createFacilities(handler) {
  const { tableName } = handler.cabins.TempFacilityModel;
  const sql = [
    'INSERT INTO facility (name_lower_case, name)',
    'SELECT DISTINCT name_lower_case, name',
    `FROM public.${tableName}`,
    'ON CONFLICT (name_lower_case) DO NOTHING',
  ].join('\n');

  logger.info('Create new facilities');
  const durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);
}


/**
 * Create new cabin facilities
 */
async function createCabinFacilities(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.cabins.TempCabinFacilityModel;

  // Set UUIDs on cabinFacility temp data
  sql = [
    `UPDATE public.${tableName} gt1 SET`,
    '  cabin_uuid = g.uuid',
    `FROM public.${tableName} gt2`,
    'INNER JOIN public.cabin g ON',
    '  g.id_legacy_ntb = gt2.id_cabin_legacy_ntb',
    'WHERE',
    '  gt1.id_cabin_legacy_ntb = gt2.id_cabin_legacy_ntb',
  ].join('\n');

  logger.info('Update uuids on cabin facility temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Create cabin facility relations
  sql = [
    'INSERT INTO cabin_facility (',
    '  facility_name, cabin_uuid, description, data_source',
    ')',
    'SELECT',
    '  name_lower_case, cabin_uuid, description, :data_source',
    `FROM public.${tableName}`,
    'ON CONFLICT (facility_name, cabin_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Create new cabin facilities');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove cabin facilities that no longer exist in legacy-ntb
 */
async function removeDepreactedCabinFacilities(handler) {
  const { tableName } = handler.cabins.TempCabinFacilityModel;
  const sql = [
    'DELETE FROM public.cabin_facility',
    'USING public.cabin_facility cf',
    `LEFT JOIN public.${tableName} te ON`,
    '  cf.facility_name = te.name_lower_case AND',
    '  cf.cabin_uuid = te.cabin_uuid',
    'WHERE',
    '  te.id_cabin_legacy_ntb IS NULL AND',
    '  cf.data_source = :data_source AND',
    '  public.cabin_facility.facility_name = cf.facility_name AND',
    '  public.cabin_facility.cabin_uuid = cf.cabin_uuid',
  ].join('\n');

  logger.info('Deleting deprecated cabin facilities');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Create new accessabilities
 */
async function createAccessabilities(handler) {
  const { tableName } = handler.cabins.TempAccessabilityModel;
  const sql = [
    'INSERT INTO accessability (name_lower_case, name)',
    'SELECT DISTINCT name_lower_case, name',
    `FROM public.${tableName}`,
    'ON CONFLICT (name_lower_case) DO NOTHING',
  ].join('\n');

  logger.info('Create new accessabilities');
  const durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);
}


/**
 * Create new cabin accessabilities
 */
async function createCabinAccessabilities(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.cabins.TempCabinAccessabilityModel;

  // Set UUIDs on cabinAccessability temp data
  sql = [
    `UPDATE public.${tableName} gt1 SET`,
    '  cabin_uuid = g.uuid',
    `FROM public.${tableName} gt2`,
    'INNER JOIN public.cabin g ON',
    '  g.id_legacy_ntb = gt2.id_cabin_legacy_ntb',
    'WHERE',
    '  gt1.id_cabin_legacy_ntb = gt2.id_cabin_legacy_ntb',
  ].join('\n');

  logger.info('Update uuids on cabin accessability temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Create cabin accessability relations
  sql = [
    'INSERT INTO cabin_accessability (',
    '  accessability_name, cabin_uuid, description, data_source',
    ')',
    'SELECT',
    '  name_lower_case, cabin_uuid, description, :data_source',
    `FROM public.${tableName}`,
    'ON CONFLICT (accessability_name, cabin_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Create new cabin accessabilities');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove cabin accessabilities that no longer exist in legacy-ntb
 */
async function removeDepreactedCabinAccessabilities(handler) {
  const { tableName } = handler.cabins.TempCabinAccessabilityModel;
  const sql = [
    'DELETE FROM public.cabin_accessability',
    'USING public.cabin_accessability cf',
    `LEFT JOIN public.${tableName} te ON`,
    '  cf.accessability_name = te.name_lower_case AND',
    '  cf.cabin_uuid = te.cabin_uuid',
    'WHERE',
    '  te.id_cabin_legacy_ntb IS NULL AND',
    '  cf.data_source = :data_source AND',
    '  public.cabin_accessability.accessability_name = cf.accessability_name',
    '  AND public.cabin_accessability.cabin_uuid = cf.cabin_uuid',
  ].join('\n');

  logger.info('Deleting deprecated cabin accessabilities');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Process legacy cabin data and merge it into the postgres database
 */
const process = async (handler) => {
  logger.info('Processing cabins');
  handler.cabins = {};

  await mapData(handler);
  await createTempTables(handler);
  await populateTempTables(handler);
  await mergeCabin(handler);
  await mergeCabinTranslation(handler);
  await mergeCabinLinks(handler);
  await removeDepreactedCabinLinks(handler);
  await createTags(handler);
  await createTagRelations(handler);
  await removeDepreactedCabinTags(handler);
  await createFacilities(handler);
  await createCabinFacilities(handler);
  await removeDepreactedCabinFacilities(handler);
  await createAccessabilities(handler);
  await createCabinAccessabilities(handler);
  await removeDepreactedCabinAccessabilities(handler);
  // await dropTempTables(handler);
};


export default process;

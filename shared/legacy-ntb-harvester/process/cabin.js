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
async function createTempTables(handler, first = false) {
  logger.info('Creating temporary tables');
  const durationId = startDuration();

  const baseTableName = `_temp_legacy_ntb_harvest_${handler.timeStamp}`;

  let tableName = `${baseTableName}_cabin`;
  handler.cabins.TempCabinModel = db.sequelize.define(tableName, {
    uuid: { type: db.Sequelize.UUID, primaryKey: true },
    idLegacyNtb: { type: db.Sequelize.TEXT },
    idSsr: { type: db.Sequelize.TEXT },

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
    coordinate: { type: db.Sequelize.GEOMETRY },
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
  if (first) await handler.cabins.TempCabinModel.sync();

  tableName = `${baseTableName}_cabin_service_level`;
  handler.cabins.TempServiceLevelModel =
    db.sequelize.define(tableName, {
      name: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  if (first) await handler.cabins.TempServiceLevelModel.sync();

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
  if (first) await handler.cabins.TempTranslationModel.sync();

  tableName = `${baseTableName}_cabin_links`;
  handler.cabins.TempCabinLinkModel =
    db.sequelize.define(tableName, {
      uuid: { type: db.Sequelize.UUID, primaryKey: true },
      type: { type: db.Sequelize.TEXT },
      title: { type: db.Sequelize.TEXT, allowNull: true },
      url: { type: db.Sequelize.TEXT },
      cabinUuid: { type: db.Sequelize.UUID, allowNull: true },
      idCabinLegacyNtb: { type: db.Sequelize.TEXT },
      sortIndex: { type: db.Sequelize.INTEGER },
      dataSource: { type: db.Sequelize.TEXT },
      updatedAt: { type: db.Sequelize.DATE },
    }, {
      timestamps: false,
      tableName,
    });
  if (first) await handler.cabins.TempCabinLinkModel.sync();

  tableName = `${baseTableName}_cabin_facility`;
  handler.cabins.TempFacilityModel =
    db.sequelize.define(tableName, {
      name: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  if (first) await handler.cabins.TempFacilityModel.sync();

  tableName = `${baseTableName}_cabin_facilities`;
  handler.cabins.TempCabinFacilityModel =
    db.sequelize.define(tableName, {
      name: { type: db.Sequelize.TEXT },
      idCabinLegacyNtb: { type: db.Sequelize.TEXT },
      cabinUuid: { type: db.Sequelize.UUID },
      description: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  if (first) await handler.cabins.TempCabinFacilityModel.sync();

  tableName = `${baseTableName}_cabin_accessability`;
  handler.cabins.TempAccessabilityModel =
    db.sequelize.define(tableName, {
      name: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  if (first) await handler.cabins.TempAccessabilityModel.sync();

  tableName = `${baseTableName}_cabin_accessabilities`;
  handler.cabins.TempCabinAccessabilityModel =
    db.sequelize.define(tableName, {
      name: { type: db.Sequelize.TEXT },
      idCabinLegacyNtb: { type: db.Sequelize.TEXT },
      cabinUuid: { type: db.Sequelize.UUID },
      description: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  if (first) await handler.cabins.TempCabinAccessabilityModel.sync();

  tableName = `${baseTableName}_cabin_opening_hours`;
  handler.cabins.TempCabinOHoursModel =
    db.sequelize.define(tableName, {
      uuid: { type: db.Sequelize.UUID, primaryKey: true },
      allYear: { type: db.Sequelize.BOOLEAN },
      from: { type: db.Sequelize.DATE },
      to: { type: db.Sequelize.DATE },
      serviceLevel: { type: db.Sequelize.TEXT },
      key: { type: db.Sequelize.TEXT },
      cabinUuid: { type: db.Sequelize.UUID, allowNull: true },
      idCabinLegacyNtb: { type: db.Sequelize.TEXT },
      sortIndex: { type: db.Sequelize.INTEGER },
      dataSource: { type: db.Sequelize.TEXT },
      updatedAt: { type: db.Sequelize.DATE },
    }, {
      timestamps: false,
      tableName,
    });
  if (first) await handler.cabins.TempCabinOHoursModel.sync();

  tableName = `${baseTableName}_cabin_to_area`;
  handler.cabins.TempCabinToAreaModel =
    db.sequelize.define(tableName, {
      cabin_uuid: { type: db.Sequelize.UUID },
      area_uuid: { type: db.Sequelize.UUID },
      cabinLegacyId: { type: db.Sequelize.TEXT },
      areaLegacyId: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  if (first) await handler.cabins.TempCabinToAreaModel.sync();

  tableName = `${baseTableName}_cabin_pictures`;
  handler.cabins.TempCabinPicturesModel =
    db.sequelize.define(tableName, {
      cabinLegacyId: { type: db.Sequelize.TEXT },
      cabinUuid: { type: db.Sequelize.UUID },
      pictureLegacyId: { type: db.Sequelize.TEXT },
      sortIndex: { type: db.Sequelize.INTEGER },
    }, {
      timestamps: false,
      tableName,
    });
  if (first) await handler.cabins.TempCabinPicturesModel.sync();

  endDuration(durationId);
}

/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  await handler.cabins.TempCabinModel.drop();
  await handler.cabins.TempServiceLevelModel.drop();
  await handler.cabins.TempTranslationModel.drop();
  await handler.cabins.TempCabinLinkModel.drop();
  await handler.cabins.TempFacilityModel.drop();
  await handler.cabins.TempCabinFacilityModel.drop();
  await handler.cabins.TempAccessabilityModel.drop();
  await handler.cabins.TempCabinAccessabilityModel.drop();
  await handler.cabins.TempCabinOHoursModel.drop();
  await handler.cabins.TempCabinToAreaModel.drop();
  await handler.cabins.TempCabinPicturesModel.drop();

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


  const serviceLevels = [];
  const translations = [];
  const facilities = [];
  const cabinFacilities = [];
  const accessabilities = [];
  const cabinAccessabilities = [];
  const cabinToArea = [];
  const pictures = [];
  let links = [];
  let openingHours = [];
  handler.cabins.processed.forEach((p) => {
    if (
      p.cabin.serviceLevel &&
      !serviceLevels.includes(p.cabin.serviceLevel)
    ) {
      serviceLevels.push({ name: p.cabin.serviceLevel });
    }

    p.openingHours.forEach((oh) => {
      if (oh.serviceLevel && !serviceLevels.includes(oh.serviceLevel)) {
        serviceLevels.push({ name: oh.serviceLevel });
      }
    });


    p.pictures.forEach((pictureLegacyId, idx) => pictures.push({
      pictureLegacyId,
      cabinLegacyId: p.cabin.idLegacyNtb,
      sortIndex: idx,
    }));

    if (p.english) {
      translations.push(p.english);
    }

    links = links.concat(p.links);

    openingHours = openingHours.concat(p.openingHours);

    if (p.facilities) {
      p.facilities.forEach((facility) => facilities.push({
        name: facility.name,
      }));

      p.facilities.forEach((facility) => cabinFacilities.push({
        name: facility.name,
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

    if (p.areas) {
      p.areas.forEach((area) => cabinToArea.push({
        areaLegacyId: area,
        cabinLegacyId: p.cabin.idLegacyNtb,
      }));
    }
  });

  // Insert temp data for CabinTranslation
  logger.info('Inserting cabin service levels to temporary table');
  durationId = startDuration();
  await handler.cabins.TempServiceLevelModel.bulkCreate(serviceLevels);
  endDuration(durationId);


  // Insert temp data for CabinTranslation
  logger.info('Inserting cabin translations to temporary table');
  durationId = startDuration();
  await handler.cabins.TempTranslationModel.bulkCreate(translations);
  endDuration(durationId);

  // Insert temp data for CabinLink
  logger.info('Inserting cabin links to temporary table');
  durationId = startDuration();
  await handler.cabins.TempCabinLinkModel.bulkCreate(links);
  endDuration(durationId);

  // Insert temp data for CabinOpeningHours
  logger.info('Inserting cabin opening hours to temporary table');
  durationId = startDuration();
  await handler.cabins.TempCabinOHoursModel.bulkCreate(openingHours);
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

  // Insert temp data for CabinAccessability
  logger.info('Inserting cabin to area temporary table');
  durationId = startDuration();
  await handler.cabins.TempCabinToAreaModel.bulkCreate(cabinToArea);
  endDuration(durationId);

  // Insert temp data for CabinPicture
  logger.info('Inserting cabin picture temporary table');
  durationId = startDuration();
  await handler.cabins.TempCabinPicturesModel.bulkCreate(pictures);
  endDuration(durationId);
}


/**
 * Insert into `cabin_service_level`-table
 */
async function mergeServiceLevel(handler) {
  const { tableName } = handler.cabins.TempServiceLevelModel;

  // Merge into prod table
  const sql = [
    'INSERT INTO cabin_service_level (name)',
    'SELECT name',
    `FROM public.${tableName}`,
    'ON CONFLICT (name) DO NOTHING',
  ].join('\n');

  logger.info('Creating cabin service levels');
  const durationId = startDuration();
  await db.sequelize.query(sql);
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
    '  uuid,',
    '  id_legacy_ntb,',
    '  id_ssr,',
    '  dnt_cabin,',
    '  dnt_discount,',
    '  maintainer_group_uuid,',
    '  owner_group_uuid,',
    '  contact_group_uuid,',
    '  name,',
    '  name_lower_case,',
    '  name_alt,',
    '  name_alt_lower_case,',
    '  description,',
    '  description_plain,',
    '  contact_name,',
    '  email,',
    '  phone,',
    '  mobile,',
    '  fax,',
    '  address_1,',
    '  address_2,',
    '  postal_code,',
    '  postal_name,',
    '  url,',
    '  year_of_construction,',
    '  coordinate,',
    '  service_level,',
    '  beds_extra,',
    '  beds_serviced,',
    '  beds_self_service,',
    '  beds_unmanned,',
    '  beds_winter,',
    '  booking_enabled,',
    '  booking_only,',
    '  booking_url,',
    '  htgt_winter,',
    '  htgt_summer,',
    '  map,',
    '  map_alt,',
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
    '  id_ssr,',
    '  dnt_cabin,',
    '  dnt_discount,',
    '  maintainer_group_uuid,',
    '  owner_group_uuid,',
    '  contact_group_uuid,',
    '  name,',
    '  name_lower_case,',
    '  name_alt,',
    '  name_alt_lower_case,',
    '  description,',
    '  description_plain,',
    '  contact_name,',
    '  email,',
    '  phone,',
    '  mobile,',
    '  fax,',
    '  address_1,',
    '  address_2,',
    '  postal_code,',
    '  postal_name,',
    '  url,',
    '  year_of_construction,',
    '  coordinate,',
    '  service_level,',
    '  beds_extra,',
    '  beds_serviced,',
    '  beds_self_service,',
    '  beds_unmanned,',
    '  beds_winter,',
    '  booking_enabled,',
    '  booking_only,',
    '  booking_url,',
    '  htgt_winter,',
    '  htgt_summer,',
    '  map,',
    '  map_alt,',
    '  license,',
    '  provider,',
    '  status::enum_cabin_status,',
    '  :data_source,',
    '  updated_at,',
    '  updated_at,',
    '  1',
    `FROM public.${tableName}`,
    'ON CONFLICT (id_legacy_ntb) DO UPDATE',
    'SET',
    '   id_ssr = EXCLUDED.id_ssr,',
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
    '   coordinate = EXCLUDED.coordinate,',
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
    '  gl1.sort_index = gl2.sort_index',
  ].join('\n');

  logger.info('Update uuids on cabin links temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO cabin_link (',
    '  uuid, cabin_uuid, type, title, url,',
    '  sort_index, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  uuid, cabin_uuid, type, title, url,',
    '  sort_index, :data_source, now(), now()',
    `FROM public.${tableName}`,
    'ON CONFLICT (cabin_uuid, sort_index) DO UPDATE',
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
    '  gl.cabin_uuid = te.cabin_uuid AND',
    '  gl.sort_index = te.sort_index',
    'WHERE',
    '  te.id_cabin_legacy_ntb IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.cabin_link.cabin_uuid = gl.cabin_uuid AND',
    '  public.cabin_link.sort_index = gl.sort_index',
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
 * Create new facilities
 */
async function createFacilities(handler) {
  const { tableName } = handler.cabins.TempFacilityModel;
  const sql = [
    'INSERT INTO facility (name)',
    'SELECT DISTINCT name',
    `FROM public.${tableName}`,
    'ON CONFLICT (name) DO NOTHING',
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
    '  name, cabin_uuid, description, :data_source',
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
    '  cf.facility_name = te.name AND',
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
    'INSERT INTO accessability (name)',
    'SELECT DISTINCT name',
    `FROM public.${tableName}`,
    'ON CONFLICT (name) DO NOTHING',
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
    '  name, cabin_uuid, description, :data_source',
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
    '  cf.accessability_name = te.name AND',
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
 * Insert into `CABIN_link`-table or update if it already exists
 */
async function mergeCabinOpeningHours(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.cabins.TempCabinOHoursModel;

  // Set UUIDs on cabinLink temp data
  sql = [
    `UPDATE public.${tableName} gl1 SET`,
    '  cabin_uuid = g.uuid',
    `FROM public.${tableName} gl2`,
    'INNER JOIN public.cabin g ON',
    '  g.id_legacy_ntb = gl2.id_cabin_legacy_ntb',
    'WHERE',
    '  gl1.id_cabin_legacy_ntb = gl2.id_cabin_legacy_ntb AND',
    '  gl1.sort_index = gl2.sort_index',
  ].join('\n');

  logger.info('Update uuids on cabin opening hours temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO cabin_opening_hours (',
    '  uuid, cabin_uuid, all_year, "from", "to", service_level, key,',
    '  sort_index, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  uuid, cabin_uuid, all_year, "from", "to",',
    '  service_level,',
    '  key::enum_cabin_opening_hours_key, sort_index, :data_source, now(),',
    '  now()',
    `FROM public.${tableName}`,
    'ON CONFLICT (cabin_uuid, sort_index) DO UPDATE',
    'SET',
    '  "all_year" = EXCLUDED."all_year",',
    '  "from" = EXCLUDED."from",',
    '  "to" = EXCLUDED."to",',
    '  "service_level" = EXCLUDED."service_level",',
    '  "key" = EXCLUDED."key"',
  ].join('\n');

  logger.info('Creating or updating cabin opening hours');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove cabin opening hours that no longer exist in legacy-ntb
 */
async function removeDepreactedCabinOpeningHours(handler) {
  const { tableName } = handler.cabins.TempCabinOHoursModel;
  const sql = [
    'DELETE FROM public.cabin_opening_hours',
    'USING public.cabin_opening_hours gl',
    `LEFT JOIN public.${tableName} te ON`,
    '  gl.cabin_uuid = te.cabin_uuid AND',
    '  gl.sort_index = te.sort_index',
    'WHERE',
    '  te.cabin_uuid IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.cabin_opening_hours.cabin_uuid = ',
    '    gl.cabin_uuid AND',
    '  public.cabin_opening_hours.sort_index = ',
    '    gl.sort_index',
  ].join('\n');

  logger.info('Deleting deprecated cabin opening hours');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Insert into `cabin_to_area`-table or update if it already exists
 */
async function mergeCabinToArea(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.cabins.TempCabinToAreaModel;

  // Set UUIDs on cabinToArea temp data
  sql = [
    `UPDATE public.${tableName} a1 SET`,
    '  cabin_uuid = c.uuid,',
    '  area_uuid = a.uuid',
    `FROM public.${tableName} a2`,
    'INNER JOIN public.area a ON',
    '  a.id_legacy_ntb = a2.area_legacy_id',
    'INNER JOIN public.cabin c ON',
    '  c.id_legacy_ntb = a2.cabin_legacy_id',
    'WHERE',
    '  a1.area_legacy_id = a2.area_legacy_id AND',
    '  a1.cabin_legacy_id = a2.cabin_legacy_id',
  ].join('\n');

  logger.info('Update uuids on cabin-to-area temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO cabin_to_area (',
    '  cabin_uuid, area_uuid, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  cabin_uuid, area_uuid, :data_source, now(), now()',
    `FROM public.${tableName}`,
    'WHERE cabin_uuid IS NOT NULL AND area_uuid IS NOT NULL',
    'ON CONFLICT (cabin_uuid, area_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating cabin to area relations');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove area to area relations that no longer exist in legacy-ntb
 */
async function removeDepreactedCabinToArea(handler) {
  const { tableName } = handler.cabins.TempCabinToAreaModel;

  const sql = [
    'DELETE FROM public.cabin_to_area',
    'USING public.cabin_to_area c2a',
    `LEFT JOIN public.${tableName} te ON`,
    '  c2a.cabin_uuid = te.cabin_uuid AND',
    '  c2a.area_uuid = te.area_uuid',
    'WHERE',
    '  te.area_uuid IS NULL AND',
    '  c2a.data_source = :data_source AND',
    '  public.cabin_to_area.cabin_uuid = c2a.cabin_uuid AND',
    '  public.cabin_to_area.area_uuid = c2a.area_uuid',
  ].join('\n');

  logger.info('Deleting deprecated cabin to area relations');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Insert cabin uuid into `pictures`-table
 */
async function setCabinPictures(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.cabins.TempCabinPicturesModel;

  // Set UUIDs on cabinToCabin temp data
  sql = [
    `UPDATE public.${tableName} a1 SET`,
    '  cabin_uuid = a.uuid',
    `FROM public.${tableName} a2`,
    'INNER JOIN public.cabin a ON',
    '  a.id_legacy_ntb = a2.cabin_legacy_id',
    'WHERE',
    '  a1.cabin_legacy_id = a2.cabin_legacy_id AND',
    '  a1.picture_legacy_id = a2.picture_legacy_id',
  ].join('\n');

  logger.info('Update uuids on cabin-to-picture temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'UPDATE picture p1 SET',
    '  cabin_uuid = a.cabin_uuid,',
    '  sort_index = a.sort_index,',
    '  cabin_picture_type = (',
    '    CASE p2.legacy_first_tag',
    '      WHEN \'vinter\'',
    '        THEN \'winter\'',
    '      WHEN \'sommer\'',
    '        THEN \'summer\'',
    '      WHEN \'interiør\'',
    '        THEN \'interior\'',
    '      ELSE',
    '        \'other\'',
    '    END',
    '  )::enum_picture_cabin_picture_type',
    'FROM picture p2',
    `INNER JOIN public.${tableName} a ON`,
    '  a.picture_legacy_id = p2.id_legacy_ntb',
    'WHERE',
    '  p1.uuid = p2.uuid',
  ].join('\n');

  logger.info('Setting cabin uuid on pictures');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove pictures that used to belong to an cabin in legacy-ntb
 */
async function removeDepreactedCabinPictures(handler) {
  const { tableName } = handler.cabins.TempCabinPicturesModel;
  const sql = [
    'DELETE FROM public.picture',
    'USING public.picture p2',
    `LEFT JOIN public.${tableName} te ON`,
    '  p2.id_legacy_ntb = te.picture_legacy_id',
    'WHERE',
    '  te.picture_legacy_id IS NULL AND',
    '  p2.cabin_uuid IS NOT NULL AND',
    '  p2.data_source = :data_source AND',
    '  public.picture.uuid = p2.uuid',
  ].join('\n');

  logger.info('Deleting deprecated cabin pictures');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Mark cabins that no longer exist in legacy-ntb as deleted
 */
async function removeDepreactedCabin(handler) {
  const { tableName } = handler.cabins.TempCabinModel;
  const sql = [
    'UPDATE public.cabin a1 SET',
    '  status = :status',
    'FROM public.cabin a2',
    `LEFT JOIN public.${tableName} t ON`,
    '  t.id_legacy_ntb = a2.id_legacy_ntb',
    'WHERE',
    '  t.id_legacy_ntb IS NULL AND',
    '  a1.uuid = a2.uuid AND',
    '  a2.data_source = :data_source AND',
    '  a2.status != :status',
  ].join('\n');

  logger.info('Marking deprecated cabins as deleted');
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
 * Process legacy cabin data and merge it into the postgres database
 */
const process = async (handler) => {
  logger.info('Processing cabins');
  handler.cabins = {};

  await createTempTables(handler, false);
  await mergeServiceLevel(handler);
  await mergeCabin(handler);
  await mergeCabinTranslation(handler);
  await mergeCabinLinks(handler);
  await removeDepreactedCabinLinks(handler);
  await createFacilities(handler);
  await createCabinFacilities(handler);
  await removeDepreactedCabinFacilities(handler);
  await createAccessabilities(handler);
  await createCabinAccessabilities(handler);
  await removeDepreactedCabinAccessabilities(handler);
  await mergeCabinOpeningHours(handler);
  await removeDepreactedCabinOpeningHours(handler);
  await mergeCabinToArea(handler);
  await removeDepreactedCabinToArea(handler);
  await setCabinPictures(handler);
  await removeDepreactedCabinPictures(handler);
  await removeDepreactedCabin(handler);
  await dropTempTables(handler);
};


/**
 * Map cabin data
 */
export const mapCabinData = async (handler, first = false) => {
  logger.info('Mapping cabins');
  handler.cabins = {};

  await mapData(handler);
  await createTempTables(handler, first);
  await populateTempTables(handler);
};


export default process;

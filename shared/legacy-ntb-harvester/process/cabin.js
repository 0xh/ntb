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

  // cabins
  let tableName = `${baseTableName}_cabin`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('id')
        .primary();
      table.text('idLegacyNtb');
      table.text('idSsr');
      table.boolean('dntCabin');
      table.boolean('dntDiscount');
      table.uuid('maintainerGroupId');
      table.text('maintainerIdGroupLegacyNtb');
      table.uuid('ownerGroupId');
      table.text('ownerIdGroupLegacyNtb');
      table.uuid('contactGroupId');
      table.text('contactIdGroupLegacyNtb');
      table.text('name');
      table.text('nameLowerCase');
      table.specificType('nameAlt', 'TEXT[]');
      table.specificType('nameAltLowerCase', 'TEXT[]');
      table.text('description');
      table.text('descriptionPlain');
      table.text('contactName');
      table.text('email');
      table.text('phone');
      table.text('mobile');
      table.text('fax');
      table.text('address1');
      table.text('address2');
      table.text('postalCode');
      table.text('postalName');
      table.text('url');
      table.integer('yearOfConstruction');
      table.specificType('coordinates', 'GEOMETRY');
      table.uuid('countyId');
      table.uuid('municipalityId');
      table.text('serviceLevel');
      table.integer('bedsExtra');
      table.integer('bedsStaffed');
      table.integer('bedsSelfService');
      table.integer('bedsNoService');
      table.integer('bedsWinter');
      table.boolean('bookingEnabled');
      table.boolean('bookingOnly');
      table.text('bookingUrl');
      table.text('htgtGeneral');
      table.text('htgtWinter');
      table.text('htgtSummer');
      table.text('htgtPublicTransport');
      table.boolean('htgtCarAllYear');
      table.boolean('htgtCarSummer');
      table.boolean('htgtBicycle');
      table.boolean('htgtPublicTransportAvailable');
      table.boolean('htgtBoatTransportAvailable');
      table.text('map');
      table.specificType('mapAlt', 'TEXT[]');
      table.text('license');
      table.text('provider');
      table.text('status');
      table.text('dataSource');
      table.timestamp('updatedAt');
    });
  }

  class TempCabinModel extends Model {
    static tableName = tableName;
  }
  handler.cabins.TempCabinModel = TempCabinModel;


  // cabin service levels
  tableName = `${baseTableName}_cabin_sl`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.text('name')
        .primary();
    });
  }

  class TempServiceLevelModel extends Model {
    static tableName = tableName;
    static idColumn = 'name';
  }
  handler.cabins.TempServiceLevelModel = TempServiceLevelModel;


  // cabin translations
  tableName = `${baseTableName}_cabin_translation`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('id')
        .primary();
      table.uuid('cabinId');
      table.text('cabinIdLegacyNtb');
      table.text('name');
      table.text('nameLowerCase');
      table.text('description');
      table.text('descriptionPlain');
      table.text('language');
      table.text('dataSource');
    });
  }

  class TempTranslationModel extends Model {
    static tableName = tableName;
  }
  handler.cabins.TempTranslationModel = TempTranslationModel;


  // cabin links
  tableName = `${baseTableName}_cabin_links`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('id')
        .primary();
      table.uuid('cabinId');
      table.text('idCabinLegacyNtb');
      table.text('type');
      table.text('title');
      table.text('url');
      table.integer('sortIndex');
      table.text('dataSource');
    });
  }

  class TempCabinLinkModel extends Model {
    static tableName = tableName;
  }
  handler.cabins.TempCabinLinkModel = TempCabinLinkModel;


  // facilities
  tableName = `${baseTableName}_cabin_facility`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.text('name')
        .primary();
    });
  }

  class TempFacilityModel extends Model {
    static tableName = tableName;
    static idColumn = 'name';
  }
  handler.cabins.TempFacilityModel = TempFacilityModel;


  // cabin facilities
  tableName = `${baseTableName}_cabin_facilities`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.text('name');
      table.text('idCabinLegacyNtb');
      table.uuid('cabinId');
      table.text('description');

      table.primary(['name', 'idCabinLegacyNtb']);
    });
  }

  class TempCabinFacilityModel extends Model {
    static tableName = tableName;
    static idColumn = ['name', 'idCabinLegacyNtb'];
  }
  handler.cabins.TempCabinFacilityModel = TempCabinFacilityModel;


  // accessabilities
  tableName = `${baseTableName}_cabin_acc`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.text('name')
        .primary();
    });
  }

  class TempAccessabilityModel extends Model {
    static tableName = tableName;
    static idColumn = 'name';
  }
  handler.cabins.TempAccessabilityModel = TempAccessabilityModel;


  // cabin accessabilities
  tableName = `${baseTableName}_cabin_acc_2`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.text('name');
      table.text('idCabinLegacyNtb');
      table.uuid('cabinId');
      table.text('description');

      table.primary(['name', 'idCabinLegacyNtb']);
    });
  }

  class TempCabinAccessabilityModel extends Model {
    static tableName = tableName;
    static idColumn = ['name', 'idCabinLegacyNtb'];
  }
  handler.cabins.TempCabinAccessabilityModel = TempCabinAccessabilityModel;


  // cabin opening hours
  tableName = `${baseTableName}_cabin_oh`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('id')
        .primary();
      table.boolean('allYear');
      table.timestamp('from');
      table.timestamp('to');
      table.text('serviceLevel');
      table.text('key');
      table.text('description');
      table.uuid('cabinId');
      table.text('idCabinLegacyNtb');
      table.integer('sortIndex');
      table.text('dataSource');
      table.timestamp('updatedAt');
    });
  }

  class TempCabinOHoursModel extends Model {
    static tableName = tableName;
  }
  handler.cabins.TempCabinOHoursModel = TempCabinOHoursModel;


  // cabins to areas
  tableName = `${baseTableName}_cabin_to_area`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('cabinId');
      table.uuid('areaId');
      table.text('cabinLegacyId');
      table.text('areaLegacyId');

      table.primary(['cabinLegacyId', 'areaLegacyId']);
    });
  }

  class TempCabinToAreaModel extends Model {
    static tableName = tableName;
    static idColumn = ['cabinLegacyId', 'areaLegacyId'];
  }
  handler.cabins.TempCabinToAreaModel = TempCabinToAreaModel;


  // cabin pictures
  tableName = `${baseTableName}_cabin_pictures`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.text('cabinLegacyId');
      table.uuid('cabinId');
      table.text('pictureLegacyId');
      table.integer('sortIndex');

      table.primary(['pictureLegacyId', 'cabinLegacyId']);
    });
  }

  class TempCabinPicturesModel extends Model {
    static tableName = tableName;
    static idColumn = ['pictureLegacyId', 'cabinLegacyId'];
  }
  handler.cabins.TempCabinPicturesModel = TempCabinPicturesModel;


  endDuration(durationId);
}

/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  await knex.schema
    .dropTableIfExists(handler.cabins.TempCabinModel.tableName)
    .dropTableIfExists(handler.cabins.TempServiceLevelModel.tableName)
    .dropTableIfExists(handler.cabins.TempTranslationModel.tableName)
    .dropTableIfExists(handler.cabins.TempCabinLinkModel.tableName)
    .dropTableIfExists(handler.cabins.TempFacilityModel.tableName)
    .dropTableIfExists(handler.cabins.TempCabinFacilityModel.tableName)
    .dropTableIfExists(handler.cabins.TempAccessabilityModel.tableName)
    .dropTableIfExists(handler.cabins.TempCabinAccessabilityModel.tableName)
    .dropTableIfExists(handler.cabins.TempCabinOHoursModel.tableName)
    .dropTableIfExists(handler.cabins.TempCabinToAreaModel.tableName)
    .dropTableIfExists(handler.cabins.TempCabinPicturesModel.tableName);

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
  const cabins = handler.cabins.processed.map((p) => {
    const { cabin } = p;
    if (cabin.coordinates) {
      cabin.coordinates = geomFromGeoJSON(cabin.coordinates);
    }
    return cabin;
  });
  await handler.cabins.TempCabinModel
    .query()
    .insert(cabins);
  endDuration(durationId);


  const foundServiceLevels = [];
  const serviceLevels = [];
  const translations = [];
  const facilities = [];
  const foundFacilities = [];
  const cabinFacilities = [];
  const accessabilities = [];
  const foundAccessabilities = [];
  const cabinAccessabilities = [];
  const cabinToArea = [];
  const pictures = [];
  let links = [];
  let openingHours = [];
  handler.cabins.processed.forEach((p) => {
    if (
      p.cabin.serviceLevel &&
      !foundServiceLevels.includes(p.cabin.serviceLevel)
    ) {
      foundServiceLevels.push(p.cabin.serviceLevel);
      serviceLevels.push({ name: p.cabin.serviceLevel });
    }

    p.openingHours.forEach((oh) => {
      if (oh.serviceLevel && !foundServiceLevels.includes(oh.serviceLevel)) {
        foundServiceLevels.push(oh.serviceLevel);
        serviceLevels.push({ name: oh.serviceLevel });
      }
    });

    p.pictures.forEach((pictureLegacyId, idx) => {
      const exists = pictures
        .some((pic) => (
          pic.pictureLegacyId === pictureLegacyId
          && pic.cabinLegacyId === p.cabin.idLegacyNtb
        ));

      if (!exists) {
        pictures.push({
          pictureLegacyId,
          cabinLegacyId: p.cabin.idLegacyNtb,
          sortIndex: idx,
        });
      }
    });

    if (p.english) {
      translations.push(p.english);
    }

    links = links.concat(p.links);

    openingHours = openingHours.concat(p.openingHours);

    if (p.facilities) {
      p.facilities.forEach((facility) => {
        if (!foundFacilities.includes(facility.name)) {
          facilities.push({ name: facility.name });
          foundFacilities.push(facility.name);
        }
      });

      p.facilities.forEach((facility) => cabinFacilities.push({
        name: facility.name,
        idCabinLegacyNtb: p.cabin.idLegacyNtb,
        description: facility.description,
      }));
    }

    if (p.accessibility) {
      p.accessibility.forEach((accessability) => {
        if (!foundAccessabilities.includes(accessability.name)) {
          accessabilities.push({
            name: accessability.name,
            nameLowerCase: accessability.nameLowerCase,
          });
          foundAccessabilities.push(accessability.name);
        }
      });

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
  await handler.cabins.TempServiceLevelModel
    .query()
    .insert(serviceLevels);
  endDuration(durationId);


  // Insert temp data for CabinTranslation
  logger.info('Inserting cabin translations to temporary table');
  durationId = startDuration();
  await handler.cabins.TempTranslationModel
    .query()
    .insert(translations);
  endDuration(durationId);

  // Insert temp data for CabinLink
  logger.info('Inserting cabin links to temporary table');
  durationId = startDuration();
  await handler.cabins.TempCabinLinkModel
    .query()
    .insert(links);
  endDuration(durationId);

  // Insert temp data for CabinOpeningHours
  logger.info('Inserting cabin opening hours to temporary table');
  durationId = startDuration();
  await handler.cabins.TempCabinOHoursModel
    .query()
    .insert(openingHours);
  endDuration(durationId);

  // Insert temp data for Facility
  logger.info('Inserting facilities to temporary table');
  durationId = startDuration();
  await handler.cabins.TempFacilityModel
    .query()
    .insert(facilities);
  endDuration(durationId);

  // Insert temp data for CabinFacility
  logger.info('Inserting cabin facilities to temporary table');
  durationId = startDuration();
  await handler.cabins.TempCabinFacilityModel
    .query()
    .insert(cabinFacilities);
  endDuration(durationId);

  // Insert temp data for Accessability
  logger.info('Inserting accessabilities to temporary table');
  durationId = startDuration();
  await handler.cabins.TempAccessabilityModel
    .query()
    .insert(accessabilities);
  endDuration(durationId);

  // Insert temp data for CabinAccessability
  logger.info('Inserting cabin accessabilities to temporary table');
  durationId = startDuration();
  await handler.cabins.TempCabinAccessabilityModel
    .query()
    .insert(cabinAccessabilities);
  endDuration(durationId);

  // Insert temp data for CabinAccessability
  logger.info('Inserting cabin to area temporary table');
  durationId = startDuration();
  await handler.cabins.TempCabinToAreaModel
    .query()
    .insert(cabinToArea);
  endDuration(durationId);

  // Insert temp data for CabinPicture
  logger.info('Inserting cabin picture temporary table');
  durationId = startDuration();
  await handler.cabins.TempCabinPicturesModel
    .query()
    .insert(pictures);
  endDuration(durationId);
}


/**
 * Insert into `cabin_service_level`-table
 */
async function mergeServiceLevel(handler) {
  const { tableName } = handler.cabins.TempServiceLevelModel;

  // Merge into prod table
  const sql = [
    'INSERT INTO cabin_service_levels (name)',
    'SELECT name',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (name) DO NOTHING',
  ].join('\n');

  logger.info('Creating cabin service levels');
  const durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);
}


/**
 * Insert into `cabin`-table or update if it already exists
 */
async function mergeCabin(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.cabins.TempCabinModel;

  // Set ids on maintainer group on cabin temp data
  sql = [
    `UPDATE "public"."${tableName}" c1 SET`,
    '  maintainer_group_id = g1.id',
    `FROM "public"."${tableName}" c2`,
    'INNER JOIN public."groups" g1 ON',
    '  g1.id_legacy_ntb = c2.maintainer_id_group_legacy_ntb',
    'WHERE',
    '  c1.id_legacy_ntb = c2.id_legacy_ntb',
  ].join('\n');

  logger.info('Update ids on cabin maintainer temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Set ids on owner group on cabin temp data
  sql = [
    `UPDATE "public"."${tableName}" c1 SET`,
    '  owner_group_id = g1.id',
    `FROM "public"."${tableName}" c2`,
    'INNER JOIN public."groups" g1 ON',
    '  g1.id_legacy_ntb = c2.owner_id_group_legacy_ntb',
    'WHERE',
    '  c1.id_legacy_ntb = c2.id_legacy_ntb',
  ].join('\n');

  logger.info('Update ids on cabin owner temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Set ids on contact group on cabin temp data
  sql = [
    `UPDATE "public"."${tableName}" c1 SET`,
    '  contact_group_id = g1.id',
    `FROM "public"."${tableName}" c2`,
    'INNER JOIN public."groups" g1 ON',
    '  g1.id_legacy_ntb = c2.contact_id_group_legacy_ntb',
    'WHERE',
    '  c1.id_legacy_ntb = c2.id_legacy_ntb',
  ].join('\n');

  logger.info('Update ids on cabin contact temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO cabins (',
    '  id,',
    '  id_legacy_ntb,',
    '  id_ssr,',
    '  dnt_cabin,',
    '  dnt_discount,',
    '  maintainer_group_id,',
    '  owner_group_id,',
    '  contact_group_id,',
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
    '  coordinates,',
    '  service_level,',
    '  beds_extra,',
    '  beds_staffed,',
    '  beds_self_service,',
    '  beds_no_service,',
    '  beds_winter,',
    '  booking_enabled,',
    '  booking_only,',
    '  booking_url,',
    '  htgt_general,',
    '  htgt_winter,',
    '  htgt_summer,',
    '  htgt_public_transport,',
    '  htgt_car_all_year,',
    '  htgt_car_summer,',
    '  htgt_bicycle,',
    '  htgt_public_transport_available,',
    '  htgt_boat_transport_available,',
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
    '  id,',
    '  id_legacy_ntb,',
    '  id_ssr,',
    '  dnt_cabin,',
    '  dnt_discount,',
    '  maintainer_group_id,',
    '  owner_group_id,',
    '  contact_group_id,',
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
    '  coordinates,',
    '  service_level,',
    '  beds_extra,',
    '  beds_staffed,',
    '  beds_self_service,',
    '  beds_no_service,',
    '  beds_winter,',
    '  booking_enabled,',
    '  booking_only,',
    '  booking_url,',
    '  htgt_general,',
    '  htgt_winter,',
    '  htgt_summer,',
    '  htgt_public_transport,',
    '  htgt_car_all_year,',
    '  htgt_car_summer,',
    '  htgt_bicycle,',
    '  htgt_public_transport_available,',
    '  htgt_boat_transport_available,',
    '  map,',
    '  map_alt,',
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
    '   id_ssr = EXCLUDED.id_ssr,',
    '   dnt_cabin = EXCLUDED.dnt_cabin,',
    '   dnt_discount = EXCLUDED.dnt_discount,',
    '   maintainer_group_id = EXCLUDED.maintainer_group_id,',
    '   owner_group_id = EXCLUDED.owner_group_id,',
    '   contact_group_id = EXCLUDED.contact_group_id,',
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
    '   coordinates = EXCLUDED.coordinates,',
    '   service_level = EXCLUDED.service_level,',
    '   beds_extra = EXCLUDED.beds_extra,',
    '   beds_staffed = EXCLUDED.beds_staffed,',
    '   beds_self_service = EXCLUDED.beds_self_service,',
    '   beds_no_service = EXCLUDED.beds_no_service,',
    '   beds_winter = EXCLUDED.beds_winter,',
    '   booking_enabled = EXCLUDED.booking_enabled,',
    '   booking_only = EXCLUDED.booking_only,',
    '   booking_url = EXCLUDED.booking_url,',
    '   htgt_general = EXCLUDED.htgt_general,',
    '   htgt_winter = EXCLUDED.htgt_winter,',
    '   htgt_summer = EXCLUDED.htgt_summer,',
    '   htgt_public_transport = EXCLUDED.htgt_public_transport,',
    '   htgt_car_all_year = EXCLUDED.htgt_car_all_year,',
    '   htgt_car_summer = EXCLUDED.htgt_car_summer,',
    '   htgt_bicycle = EXCLUDED.htgt_bicycle,',
    '   htgt_public_transport_available =',
    '     EXCLUDED.htgt_public_transport_available,',
    '   htgt_boat_transport_available =',
    '     EXCLUDED.htgt_boat_transport_available,',
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
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
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

  // Set ids on cabin in translation temp data
  sql = [
    `UPDATE "public"."${tableName}" t1 SET`,
    '  cabin_id = c.id',
    `FROM "public"."${tableName}" t2`,
    'INNER JOIN "public"."cabins" c ON',
    '  c.id_legacy_ntb = t2.cabin_id_legacy_ntb',
    'WHERE',
    '  t1.cabin_id_legacy_ntb = t2.cabin_id_legacy_ntb AND',
    '  t1.language = t2.language',
  ].join('\n');

  logger.info('Update ids on cabin in translation temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO cabin_translations (',
    '  id, cabin_id, name, name_lower_case, description,',
    '  description_plain, language, data_source, updated_at, created_at',
    ')',
    'SELECT',
    '  id, cabin_id, name, name_lower_case, description,',
    '  description_plain, language, :data_source, now(), now()',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (cabin_id, language) DO UPDATE',
    'SET',
    '   name = EXCLUDED.name,',
    '   name_lower_case = EXCLUDED.name_lower_case,',
    '   description = EXCLUDED.description,',
    '   description_plain = EXCLUDED.description_plain',
  ].join('\n');

  logger.info('Creating or updating cabin translations');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
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

  // Set ids on cabinLink temp data
  sql = [
    `UPDATE "public"."${tableName}" gl1 SET`,
    '  cabin_id = g.id',
    `FROM "public"."${tableName}" gl2`,
    'INNER JOIN public.cabins g ON',
    '  g.id_legacy_ntb = gl2.id_cabin_legacy_ntb',
    'WHERE',
    '  gl1.id_cabin_legacy_ntb = gl2.id_cabin_legacy_ntb AND',
    '  gl1.sort_index = gl2.sort_index',
  ].join('\n');

  logger.info('Update ids on cabin links temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO cabin_links (',
    '  id, cabin_id, type, title, url,',
    '  sort_index, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  id, cabin_id, type, title, url,',
    '  sort_index, :data_source, now(), now()',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (cabin_id, sort_index) DO UPDATE',
    'SET',
    '  type = EXCLUDED.type,',
    '  title = EXCLUDED.title,',
    '  url = EXCLUDED.url',
  ].join('\n');

  logger.info('Creating or updating cabin links');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove cabin links that no longer exist in legacy-ntb
 */
async function removeDepreactedCabinLinks(handler) {
  const { tableName } = handler.cabins.TempCabinLinkModel;
  const sql = [
    'DELETE FROM public.cabin_links',
    'USING public.cabin_links gl',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  gl.cabin_id = te.cabin_id AND',
    '  gl.sort_index = te.sort_index',
    'WHERE',
    '  te.id_cabin_legacy_ntb IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.cabin_links.cabin_id = gl.cabin_id AND',
    '  public.cabin_links.sort_index = gl.sort_index',
  ].join('\n');

  logger.info('Deleting deprecated cabin links');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Create new facilities
 */
async function createFacilities(handler) {
  const { tableName } = handler.cabins.TempFacilityModel;
  const sql = [
    'INSERT INTO facilities (name)',
    'SELECT DISTINCT name',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (name) DO NOTHING',
  ].join('\n');

  logger.info('Create new facilities');
  const durationId = startDuration();
  await knex.raw(sql);
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
    `UPDATE "public"."${tableName}" gt1 SET`,
    '  cabin_id = g.id',
    `FROM "public"."${tableName}" gt2`,
    'INNER JOIN public.cabins g ON',
    '  g.id_legacy_ntb = gt2.id_cabin_legacy_ntb',
    'WHERE',
    '  gt1.id_cabin_legacy_ntb = gt2.id_cabin_legacy_ntb',
  ].join('\n');

  logger.info('Update ids on cabin facility temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Create cabin facility relations
  sql = [
    'INSERT INTO cabin_facilities (',
    '  facility_name, cabin_id, description, data_source',
    ')',
    'SELECT',
    '  name, cabin_id, description, :data_source',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (facility_name, cabin_id) DO NOTHING',
  ].join('\n');

  logger.info('Create new cabin facilities');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove cabin facilities that no longer exist in legacy-ntb
 */
async function removeDepreactedCabinFacilities(handler) {
  const { tableName } = handler.cabins.TempCabinFacilityModel;
  const sql = [
    'DELETE FROM public.cabin_facilities',
    'USING public.cabin_facilities cf',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  cf.facility_name = te.name AND',
    '  cf.cabin_id = te.cabin_id',
    'WHERE',
    '  te.id_cabin_legacy_ntb IS NULL AND',
    '  cf.data_source = :data_source AND',
    '  public.cabin_facilities.facility_name = cf.facility_name AND',
    '  public.cabin_facilities.cabin_id = cf.cabin_id',
  ].join('\n');

  logger.info('Deleting deprecated cabin facilities');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Create new accessabilities
 */
async function createAccessabilities(handler) {
  const { tableName } = handler.cabins.TempAccessabilityModel;
  const sql = [
    'INSERT INTO accessabilities (name)',
    'SELECT DISTINCT name',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (name) DO NOTHING',
  ].join('\n');

  logger.info('Create new accessabilities');
  const durationId = startDuration();
  await knex.raw(sql);
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
    `UPDATE "public"."${tableName}" gt1 SET`,
    '  cabin_id = g.id',
    `FROM "public"."${tableName}" gt2`,
    'INNER JOIN public.cabins g ON',
    '  g.id_legacy_ntb = gt2.id_cabin_legacy_ntb',
    'WHERE',
    '  gt1.id_cabin_legacy_ntb = gt2.id_cabin_legacy_ntb',
  ].join('\n');

  logger.info('Update ids on cabin accessability temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Create cabin accessability relations
  sql = [
    'INSERT INTO cabin_accessabilities (',
    '  accessability_name, cabin_id, description, data_source',
    ')',
    'SELECT',
    '  name, cabin_id, description, :data_source',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (accessability_name, cabin_id) DO NOTHING',
  ].join('\n');

  logger.info('Create new cabin accessabilities');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove cabin accessabilities that no longer exist in legacy-ntb
 */
async function removeDepreactedCabinAccessabilities(handler) {
  const { tableName } = handler.cabins.TempCabinAccessabilityModel;
  const sql = [
    'DELETE FROM public.cabin_accessabilities',
    'USING public.cabin_accessabilities cf',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  cf.accessability_name = te.name AND',
    '  cf.cabin_id = te.cabin_id',
    'WHERE',
    '  te.id_cabin_legacy_ntb IS NULL AND',
    '  cf.data_source = :data_source AND',
    '  public.cabin_accessabilities.accessability_name =',
    '    cf.accessability_name',
    '  AND public.cabin_accessabilities.cabin_id = cf.cabin_id',
  ].join('\n');

  logger.info('Deleting deprecated cabin accessabilities');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Insert into `cabin_links`-table or update if it already exists
 */
async function mergeCabinOpeningHours(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.cabins.TempCabinOHoursModel;

  // Set ids on cabinLink temp data
  sql = [
    `UPDATE "public"."${tableName}" gl1 SET`,
    '  cabin_id = g.id',
    `FROM "public"."${tableName}" gl2`,
    'INNER JOIN public.cabins g ON',
    '  g.id_legacy_ntb = gl2.id_cabin_legacy_ntb',
    'WHERE',
    '  gl1.id_cabin_legacy_ntb = gl2.id_cabin_legacy_ntb AND',
    '  gl1.sort_index = gl2.sort_index',
  ].join('\n');

  logger.info('Update ids on cabin opening hours temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO cabin_opening_hours (',
    '  id,',
    '  cabin_id,',
    '  all_year,',
    '  "from",',
    '  "to",',
    '  service_level,',
    '  key,',
    '  sort_index,',
    '  data_source,',
    '  created_at,',
    '  updated_at',
    ')',
    'SELECT',
    '  id,',
    '  cabin_id,',
    '  all_year,',
    '  "from",',
    '  "to",',
    '  service_level,',
    '  key,',
    '  sort_index,',
    '  :data_source,',
    '  now(),',
    '  now()',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (cabin_id, sort_index) DO UPDATE',
    'SET',
    '  "all_year" = EXCLUDED."all_year",',
    '  "from" = EXCLUDED."from",',
    '  "to" = EXCLUDED."to",',
    '  "service_level" = EXCLUDED."service_level",',
    '  "key" = EXCLUDED."key"',
  ].join('\n');

  logger.info('Creating or updating cabin opening hours');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
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
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  gl.cabin_id = te.cabin_id AND',
    '  gl.sort_index = te.sort_index',
    'WHERE',
    '  te.cabin_id IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.cabin_opening_hours.cabin_id = ',
    '    gl.cabin_id AND',
    '  public.cabin_opening_hours.sort_index = ',
    '    gl.sort_index',
  ].join('\n');

  logger.info('Deleting deprecated cabin opening hours');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Insert cabin id into `pictures`-table
 */
async function setCabinPictures(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.cabins.TempCabinPicturesModel;

  // Set UUIDs on cabinToCabin temp data
  sql = [
    `UPDATE "public"."${tableName}" a1 SET`,
    '  cabin_id = a.id',
    `FROM "public"."${tableName}" a2`,
    'INNER JOIN public.cabins a ON',
    '  a.id_legacy_ntb = a2.cabin_legacy_id',
    'WHERE',
    '  a1.cabin_legacy_id = a2.cabin_legacy_id AND',
    '  a1.picture_legacy_id = a2.picture_legacy_id',
  ].join('\n');

  logger.info('Update ids on cabin-to-picture temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'UPDATE pictures p1 SET',
    '  cabin_id = a.cabin_id,',
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
    '  )',
    'FROM pictures p2',
    `INNER JOIN "public"."${tableName}" a ON`,
    '  a.picture_legacy_id = p2.id_legacy_ntb',
    'WHERE',
    '  p1.id = p2.id',
  ].join('\n');

  logger.info('Setting cabin id on pictures');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove pictures that used to belong to an cabin in legacy-ntb
 */
async function removeDepreactedCabinPictures(handler) {
  const { tableName } = handler.cabins.TempCabinPicturesModel;
  const sql = [
    'DELETE FROM public.pictures',
    'USING public.pictures p2',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  p2.id_legacy_ntb = te.picture_legacy_id',
    'WHERE',
    '  te.picture_legacy_id IS NULL AND',
    '  p2.cabin_id IS NOT NULL AND',
    '  p2.data_source = :data_source AND',
    '  public.pictures.id = p2.id',
  ].join('\n');

  logger.info('Deleting deprecated cabin pictures');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Mark cabins that no longer exist in legacy-ntb as deleted
 */
async function removeDepreactedCabin(handler) {
  const { tableName } = handler.cabins.TempCabinModel;
  const sql = [
    'UPDATE public.cabins a1 SET',
    '  status = :status',
    'FROM public.cabins a2',
    `LEFT JOIN "public"."${tableName}" t ON`,
    '  t.id_legacy_ntb = a2.id_legacy_ntb',
    'WHERE',
    '  t.id_legacy_ntb IS NULL AND',
    '  a1.id = a2.id AND',
    '  a2.data_source = :data_source AND',
    '  a2.status != :status',
  ].join('\n');

  logger.info('Marking deprecated cabins as deleted');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
    status: 'deleted',
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

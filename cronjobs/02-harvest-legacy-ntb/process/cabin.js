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

  tableName = `${baseTableName}_cabin2`;
  // handler.cabins.TempCABINModel = db.sequelize.define(
  //   `${baseTableName}_cabin`, {
  //     parentLegacyId: { type: db.Sequelize.TEXT },
  //     parentUuid: { type: db.Sequelize.UUID, allowNull: true },
  //     childLegacyId: { type: db.Sequelize.TEXT },
  //     childUuid: { type: db.Sequelize.UUID, allowNull: true },
  //   }, {
  //     timestamps: false,
  //     tableName: `${baseTableName}_cabin`,
  //   }
  // );
  // await handler.cabins.TempCABINModel.sync();

  endDuration(durationId);
}

/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  await handler.cabins.TempCabinModel.drop();

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

  // // Process data for counties, minucipalities and area relations
  // const areaArea = [];
  // const areaCounty = [];
  // const areaMunicipality = [];
  // handler.cabins.processed.forEach((p) => {
  //   p.counties.forEach((countyUuid) => areaCounty.push({
  //     areaLegacyId: p.area.idLegacyNtb,
  //     countyUuid,
  //   }));
  //   p.municipalities.forEach((municipalityUuid) => areaMunicipality.push({
  //     areaLegacyId: p.area.idLegacyNtb,
  //     municipalityUuid,
  //   }));
  //   p.areaRelations.forEach((parentLegacyId) => areaArea.push({
  //     parentLegacyId,
  //     childLegacyId: p.area.idLegacyNtb,
  //   }));
  // });

  // // Insert temp data for AreaCounty
  // logger.info('Inserting area county to temporary table');
  // durationId = startDuration();
  // await handler.areas.TempAreaCountyModel.bulkCreate(areaCounty);
  // endDuration(durationId);

  // // Insert temp data for AreaMunicipality
  // logger.info('Inserting area municipality to temporary table');
  // durationId = startDuration();
  // await handler.areas.TempAreaMunicipalityModel.bulkCreate(areaMunicipality);
  // endDuration(durationId);

  // // Insert temp data for AreaArea
  // logger.info('Inserting area<>area to temporary table');
  // durationId = startDuration();
  // await handler.areas.TempAreaAreaModel.bulkCreate(areaArea);
  // endDuration(durationId);
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
 * Process legacy cabin data and merge it into the postgres database
 */
const process = async (handler) => {
  logger.info('Processing cabins');
  handler.cabins = {};

  await mapData(handler);
  await createTempTables(handler);
  await populateTempTables(handler);
  await mergeCabin(handler);
  // await dropTempTables(handler);
};


export default process;

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

  handler.areas.TempAreaModel = db.sequelize.define(`${baseTableName}_a`, {
    uuid: { type: db.Sequelize.UUID, primaryKey: true },
    idLegacyNtb: { type: db.Sequelize.TEXT },
    name: { type: db.Sequelize.TEXT },
    nameLowerCase: { type: db.Sequelize.TEXT },
    description: { type: db.Sequelize.TEXT, allowNull: true },
    descriptionPlain: { type: db.Sequelize.TEXT, allowNull: true },
    geojson: { type: db.Sequelize.GEOMETRY, allowNull: true },
    map: { type: db.Sequelize.TEXT, allowNull: true },
    url: { type: db.Sequelize.TEXT, allowNull: true },
    license: { type: db.Sequelize.TEXT, allowNull: true },
    provider: { type: db.Sequelize.TEXT, allowNull: true },
    status: { type: db.Sequelize.TEXT },
    dataSource: { type: db.Sequelize.TEXT },
    updatedAt: { type: db.Sequelize.DATE },
  }, {
    timestamps: false,
    tableName: `${baseTableName}_a`,
  });
  await handler.areas.TempAreaModel.sync();

  handler.areas.TempAreaAreaModel = db.sequelize.define(
    `${baseTableName}_aa`, {
      parentLegacyId: { type: db.Sequelize.TEXT },
      parentUuid: { type: db.Sequelize.UUID, allowNull: true },
      childLegacyId: { type: db.Sequelize.TEXT },
      childUuid: { type: db.Sequelize.UUID, allowNull: true },
    }, {
      timestamps: false,
      tableName: `${baseTableName}_aa`,
    }
  );
  await handler.areas.TempAreaAreaModel.sync();

  handler.areas.TempAreaCountyModel = db.sequelize.define(
    `${baseTableName}_ac`, {
      areaLegacyId: { type: db.Sequelize.TEXT },
      areaUuid: { type: db.Sequelize.UUID, allowNull: true },
      countyUuid: { type: db.Sequelize.UUID },
    }, {
      timestamps: false,
      tableName: `${baseTableName}_ac`,
    }
  );
  await handler.areas.TempAreaCountyModel.sync();

  handler.areas.TempAreaMunicipalityModel = db.sequelize.define(
    `${baseTableName}_am`, {
      areaLegacyId: { type: db.Sequelize.TEXT },
      areaUuid: { type: db.Sequelize.UUID, allowNull: true },
      municipalityUuid: { type: db.Sequelize.UUID },
    }, {
      timestamps: false,
      tableName: `${baseTableName}_am`,
    }
  );
  await handler.areas.TempAreaMunicipalityModel.sync();

  endDuration(durationId);
}

/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  await handler.areas.TempAreaModel.drop();
  await handler.areas.TempAreaAreaModel.drop();
  await handler.areas.TempAreaCountyModel.drop();
  await handler.areas.TempAreaMunicipalityModel.drop();

  endDuration(durationId);
}


/**
 * Send legacy ntb data through a mapper that converts old structure to new
 */
async function mapData(handler) {
  logger.info('Mapping legacy data to new structure');
  const durationId = startDuration();
  const areas = [];

  await Promise.all(handler.documents['områder'].map(async (d) => {
    const m = await legacy.områder.mapping(d, handler);
    areas.push(m);
  }));
  endDuration(durationId);

  handler.areas.processed = areas;
}


/**
 * Populate temporary tables with the processed legacy ntb data
 */
async function populateTempTables(handler) {
  let durationId;

  logger.info('Inserting areas to temporary table');
  durationId = startDuration();
  const areas = handler.areas.processed.map((p) => p.area);
  await handler.areas.TempAreaModel.bulkCreate(areas);
  endDuration(durationId);

  // Process data for counties, minucipalities and area relations
  const areaArea = [];
  const areaCounty = [];
  const areaMunicipality = [];
  handler.areas.processed.forEach((p) => {
    p.counties.forEach((countyUuid) => areaCounty.push({
      areaLegacyId: p.area.idLegacyNtb,
      countyUuid,
    }));
    p.municipalities.forEach((municipalityUuid) => areaMunicipality.push({
      areaLegacyId: p.area.idLegacyNtb,
      municipalityUuid,
    }));
    p.areaRelations.forEach((parentLegacyId) => areaArea.push({
      parentLegacyId,
      childLegacyId: p.area.idLegacyNtb,
    }));
  });

  // Insert temp data for AreaCounty
  logger.info('Inserting area county to temporary table');
  durationId = startDuration();
  await handler.areas.TempAreaCountyModel.bulkCreate(areaCounty);
  endDuration(durationId);

  // Insert temp data for AreaMunicipality
  logger.info('Inserting area municipality to temporary table');
  durationId = startDuration();
  await handler.areas.TempAreaMunicipalityModel.bulkCreate(areaMunicipality);
  endDuration(durationId);

  // Insert temp data for AreaArea
  logger.info('Inserting area<>area to temporary table');
  durationId = startDuration();
  await handler.areas.TempAreaAreaModel.bulkCreate(areaArea);
  endDuration(durationId);
}


/**
 * Insert into `area`-table or update if it already exists
 */
async function mergeAreas(handler) {
  const sql = [
    'INSERT INTO area (',
    '  uuid, id_legacy_ntb, name, name_lower_case, description,',
    '  description_plain, geojson, map, url, license, provider, status,',
    '  data_source, search_document_boost, created_at, updated_at',
    ')',
    'SELECT',
    '  uuid, id_legacy_ntb, name, name_lower_case, description,',
    '  description_plain,',
    '  geojson, map, url, license, provider, status::enum_area_status,',
    '  data_source, 1, updated_at, updated_at',
    `FROM public.${handler.areas.TempAreaModel.tableName}`,
    'ON CONFLICT (id_legacy_ntb) DO UPDATE',
    'SET',
    '  name = EXCLUDED.name,',
    '  name_lower_case = EXCLUDED.name_lower_case,',
    '  description = EXCLUDED.description,',
    '  description_plain = EXCLUDED.description_plain,',
    '  geojson = EXCLUDED.geojson,',
    '  map = EXCLUDED.map,',
    '  url = EXCLUDED.url,',
    '  license = EXCLUDED.license,',
    '  provider = EXCLUDED.provider,',
    '  status = EXCLUDED.status,',
    '  updated_at = EXCLUDED.updated_at',
  ].join('\n');

  logger.info('Creating or updating areas');
  const durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);
}


/**
 * Insert into `area_to_area`-table or update if it already exists
 */
async function mergeAreaToArea(handler) {
  let sql;
  let durationId;

  // Set UUIDs on areaToArea temp data
  sql = [
    `UPDATE public.${handler.areas.TempAreaAreaModel.tableName} a1 SET`,
    '  child_uuid = a_child.uuid,',
    '  parent_uuid = a_parent.uuid',
    `FROM public.${handler.areas.TempAreaAreaModel.tableName} a2`,
    'INNER JOIN public.area a_parent ON',
    '  a_parent.id_legacy_ntb = a2.parent_legacy_id',
    'INNER JOIN public.area a_child ON',
    '  a_child.id_legacy_ntb = a2.child_legacy_id',
    'WHERE',
    '  a1.child_legacy_id = a2.child_legacy_id AND',
    '  a1.parent_legacy_id = a2.parent_legacy_id',
  ].join('\n');

  logger.info('Update uuids on area-to-area temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO area_to_area (',
    '  parent_uuid, child_uuid, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  parent_uuid, child_uuid, :data_source, now(), now()',
    `FROM public.${handler.areas.TempAreaAreaModel.tableName}`,
    'ON CONFLICT (parent_uuid, child_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating area to area relations');
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
async function removeDepreactedAreaToArea(handler) {
  const sql = [
    'DELETE FROM public.area_to_area',
    'USING public.area_to_area a2a',
    `LEFT JOIN public.${handler.areas.TempAreaAreaModel.tableName} te ON`,
    '  a2a.parent_uuid = te.parent_uuid AND',
    '  a2a.child_uuid = te.child_uuid',
    'WHERE',
    '  te.child_uuid IS NULL AND',
    '  a2a.data_source = :data_source AND',
    '  public.area_to_area.parent_uuid = a2a.parent_uuid AND',
    '  public.area_to_area.child_uuid = a2a.child_uuid',
  ].join('\n');

  logger.info('Deleting deprecated area to area relations');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}

/**
 * Insert into `area_to_county`-table or update if it already exists
 */
async function mergeAreaToCounty(handler) {
  let sql;
  let durationId;

  // Set UUIDs on areaToArea temp data
  sql = [
    `UPDATE public.${handler.areas.TempAreaCountyModel.tableName} a1 SET`,
    '  area_uuid = a.uuid',
    `FROM public.${handler.areas.TempAreaCountyModel.tableName} a2`,
    'INNER JOIN public.area a ON',
    '  a.id_legacy_ntb = a2.area_legacy_id',
    'WHERE',
    '  a1.area_legacy_id = a2.area_legacy_id AND',
    '  a1.county_uuid = a2.county_uuid',
  ].join('\n');

  logger.info('Update uuids on area-to-county temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO area_to_county (',
    '  area_uuid, county_uuid, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  area_uuid, county_uuid, :data_source, now(), now()',
    `FROM public.${handler.areas.TempAreaCountyModel.tableName}`,
    'ON CONFLICT (area_uuid, county_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating area to county relations');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}

/**
 * Remove area to county relations that no longer exist in legacy-ntb
 */
async function removeDepreactedAreaToCounty(handler) {
  const sql = [
    'DELETE FROM public.area_to_county',
    'USING public.area_to_county a2c',
    `LEFT JOIN public.${handler.areas.TempAreaCountyModel.tableName} te ON`,
    '  a2c.area_uuid = te.area_uuid AND',
    '  a2c.county_uuid = te.county_uuid',
    'WHERE',
    '  te.area_uuid IS NULL AND',
    '  a2c.data_source = :data_source AND',
    '  public.area_to_county.area_uuid = a2c.area_uuid AND',
    '  public.area_to_county.county_uuid = a2c.county_uuid',
  ].join('\n');

  logger.info('Deleting deprecated area to county relations');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}

/**
 * Insert into `area_to_municipality`-table or update if it already exists
 */
async function mergeAreaToMunicipality(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.areas.TempAreaMunicipalityModel;

  // Set UUIDs on areaToArea temp data
  sql = [
    `UPDATE public.${tableName} a1 SET`,
    '  area_uuid = a.uuid',
    `FROM public.${tableName} a2`,
    'INNER JOIN public.area a ON',
    '  a.id_legacy_ntb = a2.area_legacy_id',
    'WHERE',
    '  a1.area_legacy_id = a2.area_legacy_id AND',
    '  a1.municipality_uuid = a2.municipality_uuid',
  ].join('\n');

  logger.info('Update uuids on area-to-municipality temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO area_to_municipality (',
    '  area_uuid, municipality_uuid, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  area_uuid, municipality_uuid, :data_source, now(), now()',
    `FROM public.${tableName}`,
    'ON CONFLICT (area_uuid, municipality_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating area to municipality relations');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}

/**
 * Remove area to municipality relations that no longer exist in legacy-ntb
 */
async function removeDepreactedAreaToMunicipality(handler) {
  const { tableName } = handler.areas.TempAreaMunicipalityModel;
  const sql = [
    'DELETE FROM public.area_to_municipality',
    'USING public.area_to_municipality a2m',
    `LEFT JOIN public.${tableName} te ON`,
    '  a2m.area_uuid = te.area_uuid AND',
    '  a2m.municipality_uuid = te.municipality_uuid',
    'WHERE',
    '  te.area_uuid IS NULL AND',
    '  a2m.data_source = :data_source AND',
    '  public.area_to_municipality.area_uuid = a2m.area_uuid AND',
    '  public.area_to_municipality.municipality_uuid = a2m.municipality_uuid',
  ].join('\n');

  logger.info('Deleting deprecated area to municipality relations');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Mark areas that no longer exist in legacy-ntb as deleted
 */
async function removeDepreactedArea(handler) {
  const { tableName } = handler.areas.TempAreaModel;
  const sql = [
    'UPDATE public.area a1 SET',
    '  status = :status',
    'FROM public.area a2',
    `LEFT JOIN public.${tableName} t ON`,
    '  t.id_legacy_ntb = a2.id_legacy_ntb',
    'WHERE',
    '  t.id_legacy_ntb IS NULL AND',
    '  a1.uuid = a2.uuid AND',
    '  a2.data_source = :data_source AND',
    '  a2.status != :status',
  ].join('\n');

  logger.info('Marking deprecated areas as deleted');
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
 * Process legacy area data and merge it into the postgres database
 */
const process = async (handler) => {
  logger.info('Processing areas');
  handler.areas = {};


  await mapData(handler);
  await createTempTables(handler);
  await populateTempTables(handler);
  await mergeAreas(handler);
  await mergeAreaToArea(handler);
  await removeDepreactedAreaToArea(handler);
  await mergeAreaToCounty(handler);
  await removeDepreactedAreaToCounty(handler);
  await mergeAreaToMunicipality(handler);
  await removeDepreactedAreaToMunicipality(handler);
  await removeDepreactedArea(handler);
  await dropTempTables(handler);
};


export default process;
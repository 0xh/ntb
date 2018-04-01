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

  let tableName = `${baseTableName}_poi`;
  handler.pois.TempPoiModel = db.sequelize.define(tableName, {
    uuid: { type: db.Sequelize.UUID, primaryKey: true },
    idLegacyNtb: { type: db.Sequelize.TEXT },
    idSsr: { type: db.Sequelize.TEXT },
    type: { type: db.Sequelize.TEXT },
    name: { type: db.Sequelize.TEXT },
    nameLowerCase: { type: db.Sequelize.TEXT },
    description: { type: db.Sequelize.TEXT },
    descriptionPlain: { type: db.Sequelize.TEXT },
    coordinate: { type: db.Sequelize.GEOMETRY },
    season: { type: db.Sequelize.ARRAY(db.Sequelize.INTEGER) },
    open: { type: db.Sequelize.BOOLEAN },
    license: { type: db.Sequelize.TEXT },
    provider: { type: db.Sequelize.TEXT },
    status: { type: db.Sequelize.TEXT },
    dataSource: { type: db.Sequelize.TEXT },
    updatedAt: { type: db.Sequelize.DATE },
  }, {
    timestamps: false,
    tableName,
  });
  await handler.pois.TempPoiModel.sync();

  tableName = `${baseTableName}_poi_types`;
  handler.pois.TempPoiTypeModel =
    db.sequelize.define(tableName, {
      type: { type: db.Sequelize.TEXT },
      poiUuid: { type: db.Sequelize.UUID, allowNull: true },
      primary: { type: db.Sequelize.BOOLEAN, default: false },
      idPoiLegacyNtb: { type: db.Sequelize.TEXT },
      sortIndex: { type: db.Sequelize.INTEGER },
      dataSource: { type: db.Sequelize.TEXT },
      updatedAt: { type: db.Sequelize.DATE },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.pois.TempPoiTypeModel.sync();

  tableName = `${baseTableName}_poi_links`;
  handler.pois.TempPoiLinkModel =
    db.sequelize.define(tableName, {
      uuid: { type: db.Sequelize.UUID, primaryKey: true },
      title: { type: db.Sequelize.TEXT, allowNull: true },
      url: { type: db.Sequelize.TEXT },
      poiUuid: { type: db.Sequelize.UUID, allowNull: true },
      idPoiLegacyNtb: { type: db.Sequelize.TEXT },
      sortIndex: { type: db.Sequelize.INTEGER },
      dataSource: { type: db.Sequelize.TEXT },
      updatedAt: { type: db.Sequelize.DATE },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.pois.TempPoiLinkModel.sync();

  tableName = `${baseTableName}_poi_accessability`;
  handler.pois.TempAccessabilityModel =
    db.sequelize.define(tableName, {
      name: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.pois.TempAccessabilityModel.sync();

  tableName = `${baseTableName}_poi_accessabilities`;
  handler.pois.TempPoiAccessabilityModel =
    db.sequelize.define(tableName, {
      name: { type: db.Sequelize.TEXT },
      idPoiLegacyNtb: { type: db.Sequelize.TEXT },
      poiUuid: { type: db.Sequelize.UUID },
      description: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.pois.TempPoiAccessabilityModel.sync();

  tableName = `${baseTableName}_poi_to_area`;
  handler.pois.TempPoiToAreaModel =
    db.sequelize.define(tableName, {
      poi_uuid: { type: db.Sequelize.UUID },
      area_uuid: { type: db.Sequelize.UUID },
      poiLegacyId: { type: db.Sequelize.TEXT },
      areaLegacyId: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.pois.TempPoiToAreaModel.sync();

  tableName = `${baseTableName}_poi_to_group`;
  handler.pois.TempPoiToGroupModel =
    db.sequelize.define(tableName, {
      poi_uuid: { type: db.Sequelize.UUID },
      group_uuid: { type: db.Sequelize.UUID },
      poiLegacyId: { type: db.Sequelize.TEXT },
      groupLegacyId: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.pois.TempPoiToGroupModel.sync();

  tableName = `${baseTableName}_poi_pictures`;
  handler.pois.TempPoiPicturesModel =
    db.sequelize.define(tableName, {
      poiLegacyId: { type: db.Sequelize.TEXT },
      poiUuid: { type: db.Sequelize.UUID },
      pictureLegacyId: { type: db.Sequelize.TEXT },
      sortIndex: { type: db.Sequelize.INTEGER },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.pois.TempPoiPicturesModel.sync();


  endDuration(durationId);
}


/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  await handler.pois.TempPoiModel.drop();
  await handler.pois.TempPoiTypeModel.drop();
  await handler.pois.TempPoiLinkModel.drop();
  await handler.pois.TempAccessabilityModel.drop();
  await handler.pois.TempPoiAccessabilityModel.drop();
  await handler.pois.TempPoiToAreaModel.drop();
  await handler.pois.TempPoiToGroupModel.drop();
  await handler.pois.TempPoiPicturesModel.drop();

  endDuration(durationId);
}


/**
 * Send legacy ntb data through a mapper that converts old structure to new
 */
async function mapData(handler) {
  logger.info('Mapping legacy data to new structure');
  const durationId = startDuration();
  const pois = [];

  await Promise.all(
    handler.documents.steder
      .filter((d) => !d.tags || d.tags[0] !== 'Hytte')
      .map(async (d) => {
        const m = await legacy.steder.mapping(d, handler);
        pois.push(m);
      })
  );
  endDuration(durationId);

  handler.pois.processed = pois;
}


/**
 * Populate temporary tables with the processed legacy ntb data
 */
async function populateTempTables(handler) {
  let durationId;

  logger.info('Inserting pois to temporary table');
  durationId = startDuration();
  const pois = handler.pois.processed.map((p) => p.poi);
  await handler.pois.TempPoiModel.bulkCreate(pois);
  endDuration(durationId);

  const accessabilities = [];
  const poiAccessabilities = [];
  const poiToArea = [];
  const poiToGroup = [];
  const pictures = [];
  let links = [];
  let poiTypes = [];
  handler.pois.processed.forEach((p) => {
    links = links.concat(p.links);
    poiTypes = poiTypes.concat(p.altTypes);

    p.pictures.forEach((pictureLegacyId, idx) => pictures.push({
      pictureLegacyId,
      poiLegacyId: p.poi.idLegacyNtb,
      sortIndex: idx,
    }));

    if (p.accessibility) {
      p.accessibility.forEach((accessability) => accessabilities.push({
        name: accessability.name,
        nameLowerCase: accessability.nameLowerCase,
      }));

      p.accessibility.forEach((accessability) => poiAccessabilities.push({
        name: accessability.name,
        nameLowerCase: accessability.nameLowerCase,
        idPoiLegacyNtb: p.poi.idLegacyNtb,
        description: accessability.description,
      }));
    }

    if (p.areas) {
      p.areas.forEach((area) => poiToArea.push({
        areaLegacyId: area.toString(),
        poiLegacyId: p.poi.idLegacyNtb,
      }));
    }

    if (p.groups) {
      p.groups.forEach((group) => poiToGroup.push({
        groupLegacyId: group.toString(),
        poiLegacyId: p.poi.idLegacyNtb,
      }));
    }
  });

  // Insert temp data for PoiLink
  logger.info('Inserting poi links to temporary table');
  durationId = startDuration();
  await handler.pois.TempPoiLinkModel.bulkCreate(links);
  endDuration(durationId);

  // Insert temp data for PoiType
  logger.info('Inserting poi types to temporary table');
  durationId = startDuration();
  await handler.pois.TempPoiTypeModel.bulkCreate(poiTypes);
  endDuration(durationId);

  // Insert temp data for Accessability
  logger.info('Inserting accessabilities to temporary table');
  durationId = startDuration();
  await handler.pois.TempAccessabilityModel.bulkCreate(accessabilities);
  endDuration(durationId);

  // Insert temp data for PoiAccessability
  logger.info('Inserting poi accessabilities to temporary table');
  durationId = startDuration();
  await handler.pois.TempPoiAccessabilityModel.bulkCreate(
    poiAccessabilities
  );
  endDuration(durationId);

  // Insert temp data for PoiAccessability
  logger.info('Inserting poi to area temporary table');
  durationId = startDuration();
  await handler.pois.TempPoiToAreaModel.bulkCreate(poiToArea);
  endDuration(durationId);

  // Insert temp data for PoiToGroup
  logger.info('Inserting poi to group temporary table');
  durationId = startDuration();
  await handler.pois.TempPoiToGroupModel.bulkCreate(poiToGroup);
  endDuration(durationId);

  // Insert temp data for PoiToGroup
  logger.info('Inserting poi pictures to temporary table');
  durationId = startDuration();
  await handler.pois.TempPoiPicturesModel.bulkCreate(pictures);
  endDuration(durationId);
}


/**
 * Insert into `poi_type`-table or update if it already exists
 */
async function mergePoiTypes(handler) {
  const { tableName } = handler.pois.TempPoiTypeModel;

  // Merge into prod table
  const sql = [
    'INSERT INTO poi_type (name)',
    'SELECT DISTINCT type',
    `FROM public.${tableName}`,
    'ON CONFLICT (name) DO NOTHING',
  ].join('\n');

  logger.info('Creating poi types');
  const durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);
}


/**
 * Insert into `poi`-table or update if it already exists
 */
async function mergePoi(handler) {
  const { tableName } = handler.pois.TempPoiModel;

  // Merge into prod table
  const sql = [
    'INSERT INTO poi (',
    '  uuid,',
    '  id_legacy_ntb,',
    '  id_ssr,',
    '  "type",',
    '  name,',
    '  name_lower_case,',
    '  description,',
    '  description_plain,',
    '  coordinate,',
    '  season,',
    '  open,',
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
    '  "type",',
    '  name,',
    '  name_lower_case,',
    '  description,',
    '  description_plain,',
    '  coordinate,',
    '  season,',
    '  open,',
    '  license,',
    '  provider,',
    '  status::enum_poi_status,',
    '  :data_source,',
    '  updated_at,',
    '  updated_at,',
    '  1',
    `FROM public.${tableName}`,
    'ON CONFLICT (id_legacy_ntb) DO UPDATE',
    'SET',
    '   "id_ssr" = EXCLUDED."id_ssr",',
    '   "type" = EXCLUDED.type,',
    '   "name" = EXCLUDED."name",',
    '   "name_lower_case" = EXCLUDED."name_lower_case",',
    '   "description" = EXCLUDED."description",',
    '   "description_plain" = EXCLUDED."description_plain",',
    '   "coordinate" = EXCLUDED."coordinate",',
    '   "season" = EXCLUDED."season",',
    '   "open" = EXCLUDED."open",',
    '   "license" = EXCLUDED."license",',
    '   "provider" = EXCLUDED."provider",',
    '   "status" = EXCLUDED."status",',
    '   "data_source" = EXCLUDED."data_source",',
    '   "updated_at" = EXCLUDED."updated_at"',
  ].join('\n');

  logger.info('Creating or updating pois');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Insert into `poi_to_poi_type`-table or update if it already exists
 */
async function mergePoiToPoiTypes(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.pois.TempPoiTypeModel;

  // Set UUIDs on poiLink temp data
  sql = [
    `UPDATE public.${tableName} gl1 SET`,
    '  poi_uuid = g.uuid',
    `FROM public.${tableName} gl2`,
    'INNER JOIN public.poi g ON',
    '  g.id_legacy_ntb = gl2.id_poi_legacy_ntb',
    'WHERE',
    '  gl1.id_poi_legacy_ntb = gl2.id_poi_legacy_ntb AND',
    '  gl1.sort_index = gl2.sort_index',
  ].join('\n');

  logger.info('Update uuids on poi types temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO poi_to_poi_type (',
    '  poi_type, poi_uuid, "primary",',
    '  sort_index, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  type, poi_uuid, "primary",',
    '  sort_index, :data_source, now(), now()',
    `FROM public.${tableName}`,
    'ON CONFLICT (poi_uuid, sort_index) DO UPDATE',
    'SET',
    '  poi_type = EXCLUDED.poi_type,',
    '  "primary" = EXCLUDED."primary"',
  ].join('\n');

  logger.info('Creating or updating poi links');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove poi to poi type relations that no longer exist in legacy-ntb
 */
async function removeDepreactedPoiToPoiTypes(handler) {
  const { tableName } = handler.pois.TempPoiTypeModel;
  const sql = [
    'DELETE FROM public.poi_to_poi_type',
    'USING public.poi_to_poi_type gl',
    `LEFT JOIN public.${tableName} te ON`,
    '  gl.poi_uuid = te.poi_uuid AND',
    '  gl.sort_index = te.sort_index',
    'WHERE',
    '  te.id_poi_legacy_ntb IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.poi_to_poi_type.poi_uuid = gl.poi_uuid AND',
    '  public.poi_to_poi_type.sort_index = gl.sort_index',
  ].join('\n');

  logger.info('Deleting deprecated poi types');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Insert into `poi_link`-table or update if it already exists
 */
async function mergePoiLinks(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.pois.TempPoiLinkModel;

  // Set UUIDs on poiLink temp data
  sql = [
    `UPDATE public.${tableName} gl1 SET`,
    '  poi_uuid = g.uuid',
    `FROM public.${tableName} gl2`,
    'INNER JOIN public.poi g ON',
    '  g.id_legacy_ntb = gl2.id_poi_legacy_ntb',
    'WHERE',
    '  gl1.id_poi_legacy_ntb = gl2.id_poi_legacy_ntb AND',
    '  gl1.sort_index = gl2.sort_index',
  ].join('\n');

  logger.info('Update uuids on poi links temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO poi_link (',
    '  uuid, poi_uuid, title, url,',
    '  sort_index, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  uuid, poi_uuid, title, url,',
    '  sort_index, :data_source, now(), now()',
    `FROM public.${tableName}`,
    'ON CONFLICT (poi_uuid, sort_index) DO UPDATE',
    'SET',
    '  title = EXCLUDED.title,',
    '  url = EXCLUDED.url',
  ].join('\n');

  logger.info('Creating or updating poi links');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove poi links that no longer exist in legacy-ntb
 */
async function removeDepreactedPoiLinks(handler) {
  const { tableName } = handler.pois.TempPoiLinkModel;
  const sql = [
    'DELETE FROM public.poi_link',
    'USING public.poi_link gl',
    `LEFT JOIN public.${tableName} te ON`,
    '  gl.poi_uuid = te.poi_uuid AND',
    '  gl.sort_index = te.sort_index',
    'WHERE',
    '  te.id_poi_legacy_ntb IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.poi_link.poi_uuid = gl.poi_uuid AND',
    '  public.poi_link.sort_index = gl.sort_index',
  ].join('\n');

  logger.info('Deleting deprecated poi links');
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
  const { tableName } = handler.pois.TempAccessabilityModel;
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
 * Create new poi accessabilities
 */
async function createPoiAccessabilities(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.pois.TempPoiAccessabilityModel;

  // Set UUIDs on poiAccessability temp data
  sql = [
    `UPDATE public.${tableName} gt1 SET`,
    '  poi_uuid = g.uuid',
    `FROM public.${tableName} gt2`,
    'INNER JOIN public.poi g ON',
    '  g.id_legacy_ntb = gt2.id_poi_legacy_ntb',
    'WHERE',
    '  gt1.id_poi_legacy_ntb = gt2.id_poi_legacy_ntb',
  ].join('\n');

  logger.info('Update uuids on poi accessability temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Create poi accessability relations
  sql = [
    'INSERT INTO poi_accessability (',
    '  accessability_name, poi_uuid, description, data_source',
    ')',
    'SELECT',
    '  name, poi_uuid, description, :data_source',
    `FROM public.${tableName}`,
    'ON CONFLICT (accessability_name, poi_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Create new poi accessabilities');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove poi accessabilities that no longer exist in legacy-ntb
 */
async function removeDepreactedPoiAccessabilities(handler) {
  const { tableName } = handler.pois.TempPoiAccessabilityModel;
  const sql = [
    'DELETE FROM public.poi_accessability',
    'USING public.poi_accessability cf',
    `LEFT JOIN public.${tableName} te ON`,
    '  cf.accessability_name = te.name AND',
    '  cf.poi_uuid = te.poi_uuid',
    'WHERE',
    '  te.id_poi_legacy_ntb IS NULL AND',
    '  cf.data_source = :data_source AND',
    '  public.poi_accessability.accessability_name = cf.accessability_name',
    '  AND public.poi_accessability.poi_uuid = cf.poi_uuid',
  ].join('\n');

  logger.info('Deleting deprecated poi accessabilities');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Insert into `poi_to_area`-table or update if it already exists
 */
async function mergePoiToArea(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.pois.TempPoiToAreaModel;

  // Set UUIDs on poiToArea temp data
  sql = [
    `UPDATE public.${tableName} a1 SET`,
    '  poi_uuid = c.uuid,',
    '  area_uuid = a.uuid',
    `FROM public.${tableName} a2`,
    'INNER JOIN public.area a ON',
    '  a.id_legacy_ntb = a2.area_legacy_id',
    'INNER JOIN public.poi c ON',
    '  c.id_legacy_ntb = a2.poi_legacy_id',
    'WHERE',
    '  a1.area_legacy_id = a2.area_legacy_id AND',
    '  a1.poi_legacy_id = a2.poi_legacy_id',
  ].join('\n');

  logger.info('Update uuids on poi-to-area temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO poi_to_area (',
    '  poi_uuid, area_uuid, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  poi_uuid, area_uuid, :data_source, now(), now()',
    `FROM public.${tableName}`,
    'WHERE poi_uuid IS NOT NULL AND area_uuid IS NOT NULL',
    'ON CONFLICT (poi_uuid, area_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating poi to area relations');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove poi to area relations that no longer exist in legacy-ntb
 */
async function removeDepreactedPoiToArea(handler) {
  const { tableName } = handler.pois.TempPoiToAreaModel;

  const sql = [
    'DELETE FROM public.poi_to_area',
    'USING public.poi_to_area c2a',
    `LEFT JOIN public.${tableName} te ON`,
    '  c2a.poi_uuid = te.poi_uuid AND',
    '  c2a.area_uuid = te.area_uuid',
    'WHERE',
    '  te.area_uuid IS NULL AND',
    '  c2a.data_source = :data_source AND',
    '  public.poi_to_area.poi_uuid = c2a.poi_uuid AND',
    '  public.poi_to_area.area_uuid = c2a.area_uuid',
  ].join('\n');

  logger.info('Deleting deprecated poi to area relations');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Insert into `poi_to_group`-table or update if it already exists
 */
async function mergePoiToGroup(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.pois.TempPoiToGroupModel;

  // Set UUIDs on poiToGroup temp data
  sql = [
    `UPDATE public.${tableName} a1 SET`,
    '  poi_uuid = c.uuid,',
    '  group_uuid = a.uuid',
    `FROM public.${tableName} a2`,
    'INNER JOIN public.group a ON',
    '  a.id_legacy_ntb = a2.group_legacy_id',
    'INNER JOIN public.poi c ON',
    '  c.id_legacy_ntb = a2.poi_legacy_id',
    'WHERE',
    '  a1.group_legacy_id = a2.group_legacy_id AND',
    '  a1.poi_legacy_id = a2.poi_legacy_id',
  ].join('\n');

  logger.info('Update uuids on poi-to-group temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO poi_to_group (',
    '  poi_uuid, group_uuid, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  poi_uuid, group_uuid, :data_source, now(), now()',
    `FROM public.${tableName}`,
    'WHERE poi_uuid IS NOT NULL AND group_uuid IS NOT NULL',
    'ON CONFLICT (poi_uuid, group_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating poi to group relations');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove poi to group relations that no longer exist in legacy-ntb
 */
async function removeDepreactedPoiToGroup(handler) {
  const { tableName } = handler.pois.TempPoiToGroupModel;

  const sql = [
    'DELETE FROM public.poi_to_group',
    'USING public.poi_to_group c2a',
    `LEFT JOIN public.${tableName} te ON`,
    '  c2a.poi_uuid = te.poi_uuid AND',
    '  c2a.group_uuid = te.group_uuid',
    'WHERE',
    '  te.group_uuid IS NULL AND',
    '  c2a.data_source = :data_source AND',
    '  public.poi_to_group.poi_uuid = c2a.poi_uuid AND',
    '  public.poi_to_group.group_uuid = c2a.group_uuid',
  ].join('\n');

  logger.info('Deleting deprecated poi to group relations');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Insert poi uuid into `pictures`-table
 */
async function setPoiPictures(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.pois.TempPoiPicturesModel;

  // Set UUIDs on poiToPoi temp data
  sql = [
    `UPDATE public.${tableName} a1 SET`,
    '  poi_uuid = a.uuid',
    `FROM public.${tableName} a2`,
    'INNER JOIN public.poi a ON',
    '  a.id_legacy_ntb = a2.poi_legacy_id',
    'WHERE',
    '  a1.poi_legacy_id = a2.poi_legacy_id AND',
    '  a1.picture_legacy_id = a2.picture_legacy_id',
  ].join('\n');

  logger.info('Update uuids on poi-to-picture temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'UPDATE picture p1 SET',
    '  poi_uuid = a.poi_uuid,',
    '  sort_index = a.sort_index',
    'FROM picture p2',
    `INNER JOIN public.${tableName} a ON`,
    '  a.picture_legacy_id = p2.id_legacy_ntb',
    'WHERE',
    '  p1.uuid = p2.uuid',
  ].join('\n');

  logger.info('Setting poi uuid on pictures');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove pictures that used to belong to an poi in legacy-ntb
 */
async function removeDepreactedPoiPictures(handler) {
  const { tableName } = handler.pois.TempPoiPicturesModel;
  const sql = [
    'DELETE FROM public.picture',
    'USING public.picture p2',
    `LEFT JOIN public.${tableName} te ON`,
    '  p2.id_legacy_ntb = te.picture_legacy_id',
    'WHERE',
    '  te.picture_legacy_id IS NULL AND',
    '  p2.poi_uuid IS NOT NULL AND',
    '  p2.data_source = :data_source AND',
    '  public.picture.uuid = p2.uuid',
  ].join('\n');

  logger.info('Deleting deprecated poi pictures');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Mark pois that no longer exist in legacy-ntb as deleted
 */
async function removeDepreactedPoi(handler) {
  const { tableName } = handler.pois.TempPoiModel;
  const sql = [
    'UPDATE public.poi a1 SET',
    '  status = :status',
    'FROM public.poi a2',
    `LEFT JOIN public.${tableName} t ON`,
    '  t.id_legacy_ntb = a2.id_legacy_ntb',
    'WHERE',
    '  t.id_legacy_ntb IS NULL AND',
    '  a1.uuid = a2.uuid AND',
    '  a2.data_source = :data_source AND',
    '  a2.status != :status',
  ].join('\n');

  logger.info('Marking deprecated pois as deleted');
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
  logger.info('Processing POIs');
  handler.pois = {};


  await mapData(handler);
  await createTempTables(handler);
  await populateTempTables(handler);
  await mergePoiTypes(handler);
  await mergePoi(handler);
  await mergePoiToPoiTypes(handler);
  await removeDepreactedPoiToPoiTypes(handler);
  await mergePoiLinks(handler);
  await removeDepreactedPoiLinks(handler);
  await createAccessabilities(handler);
  await createPoiAccessabilities(handler);
  await removeDepreactedPoiAccessabilities(handler);
  await mergePoiToArea(handler);
  await removeDepreactedPoiToArea(handler);
  await mergePoiToGroup(handler);
  await removeDepreactedPoiToGroup(handler);
  await setPoiPictures(handler);
  await removeDepreactedPoiPictures(handler);
  await removeDepreactedPoi(handler);
  await dropTempTables(handler);
};


export default process;

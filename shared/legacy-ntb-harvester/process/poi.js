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


  // pois
  let tableName = `${baseTableName}_areas`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('id')
        .primary();
      table.text('idLegacyNtb');
      table.text('idSsr');
      table.text('type');
      table.text('name');
      table.text('nameLowerCase');
      table.text('description');
      table.text('descriptionPlain');
      table.specificType('coordinates', 'GEOMETRY(Point, 4326)');
      table.specificType('season', 'INTEGER[]');
      table.boolean('open');
      table.uuid('countyId');
      table.uuid('municipalityId');
      table.text('license');
      table.text('provider');
      table.text('status');
      table.text('dataSource');
      table.timestamp('updatedAt');
    });
  }

  class TempPoiModel extends Model {
    static tableName = tableName;
  }
  handler.pois.TempPoiModel = TempPoiModel;


  // poi types
  tableName = `${baseTableName}_poi_type`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.text('type');
      table.uuid('poiId');
      table.boolean('primary');
      table.text('idPoiLegacyNtb');
      table.integer('sortIndex');
      table.text('dataSource');
      table.timestamp('updatedAt');

      table.primary(['type', 'idPoiLegacyNtb']);
    });
  }

  class TempPoiTypeModel extends Model {
    static tableName = tableName;
    static idColumn = ['type', 'idPoiLegacyNtb'];
  }
  handler.pois.TempPoiTypeModel = TempPoiTypeModel;


  // poi links
  tableName = `${baseTableName}_poi_types`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('id')
        .primary();
      table.uuid('poiId');
      table.text('title');
      table.text('url');
      table.text('idPoiLegacyNtb');
      table.integer('sortIndex');
      table.text('dataSource');
      table.timestamp('updatedAt');
    });
  }

  class TempPoiLinkModel extends Model {
    static tableName = tableName;
  }
  handler.pois.TempPoiLinkModel = TempPoiLinkModel;


  // poi accessability
  tableName = `${baseTableName}_poi_acc`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.increments();
      table.text('name');
    });
  }

  class TempAccessabilityModel extends Model {
    static tableName = tableName;
  }
  handler.pois.TempAccessabilityModel = TempAccessabilityModel;


  // poi accessabilities
  tableName = `${baseTableName}_poi_acc_2`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.text('name');
      table.text('idPoiLegacyNtb');
      table.uuid('poiId');
      table.text('description');

      table.primary(['idPoiLegacyNtb', 'name']);
    });
  }

  class TempPoiAccessabilityModel extends Model {
    static tableName = tableName;
    static idColumn = ['idPoiLegacyNtb', 'name'];
  }
  handler.pois.TempPoiAccessabilityModel = TempPoiAccessabilityModel;


  // pois to areas
  tableName = `${baseTableName}_poi_area`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('poiId');
      table.uuid('areaId');
      table.text('poiLegacyId');
      table.text('areaLegacyId');

      table.primary(['poiLegacyId', 'areaLegacyId']);
    });
  }

  class TempPoiToAreaModel extends Model {
    static tableName = tableName;
    static idColumn = ['poiLegacyId', 'areaLegacyId'];
  }
  handler.pois.TempPoiToAreaModel = TempPoiToAreaModel;


  // pois to groups
  tableName = `${baseTableName}_poi_group`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('poiId');
      table.uuid('groupId');
      table.text('poiLegacyId');
      table.text('groupLegacyId');

      table.primary(['poiLegacyId', 'groupLegacyId']);
    });
  }

  class TempPoiToGroupModel extends Model {
    static tableName = tableName;
    static idColumn = ['poiLegacyId', 'groupLegacyId'];
  }
  handler.pois.TempPoiToGroupModel = TempPoiToGroupModel;


  // poi pictures
  tableName = `${baseTableName}_poi_pic`;
  if (first) {
    await knex.schema.createTable(tableName, (table) => {
      table.text('poiLegacyId');
      table.uuid('poiId');
      table.text('pictureLegacyId');
      table.integer('sortIndex');

      table.primary(['poiLegacyId', 'pictureLegacyId']);
    });
  }

  class TempPoiPicturesModel extends Model {
    static tableName = tableName;
    static idColumn = ['poiLegacyId', 'pictureLegacyId'];
  }
  handler.pois.TempPoiPicturesModel = TempPoiPicturesModel;


  endDuration(durationId);
}


/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  knex.schema
    .dropTableIfExists(handler.pois.TempPoiModel.tableName)
    .dropTableIfExists(handler.pois.TempPoiTypeModel.tableName)
    .dropTableIfExists(handler.pois.TempPoiLinkModel.tableName)
    .dropTableIfExists(handler.pois.TempAccessabilityModel.tableName)
    .dropTableIfExists(handler.pois.TempPoiAccessabilityModel.tableName)
    .dropTableIfExists(handler.pois.TempPoiToAreaModel.tableName)
    .dropTableIfExists(handler.pois.TempPoiToGroupModel.tableName)
    .dropTableIfExists(handler.pois.TempPoiPicturesModel.tableName);

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
  const pois = handler.pois.processed.map((p) => {
    const { poi } = p;
    if (poi.coordinates) {
      poi.coordinates = geomFromGeoJSON(poi.coordinates);
    }
    return poi;
  });
  await handler.pois.TempPoiModel
    .query()
    .insert(pois);
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

    p.pictures.forEach((pictureLegacyId, idx) => {
      const exists = pictures
        .some((pic) => (
          pic.pictureLegacyId === pictureLegacyId
          && pic.poiLegacyId === p.poi.idLegacyNtb
        ));

      if (!exists) {
        pictures.push({
          pictureLegacyId,
          poiLegacyId: p.poi.idLegacyNtb,
          sortIndex: idx,
        });
      }
    });

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
  await handler.pois.TempPoiLinkModel
    .query()
    .insert(links);
  endDuration(durationId);

  // Insert temp data for PoiType
  logger.info('Inserting poi types to temporary table');
  durationId = startDuration();
  await handler.pois.TempPoiTypeModel
    .query()
    .insert(poiTypes);
  endDuration(durationId);

  // Insert temp data for Accessability
  logger.info('Inserting accessabilities to temporary table');
  durationId = startDuration();
  const distinctAccessabilities = [];
  accessabilities.forEach((a) => {
    if (!distinctAccessabilities.includes(a.name)) {
      distinctAccessabilities.push(a.name);
    }
  });
  await handler.pois.TempAccessabilityModel
    .query()
    .insert(distinctAccessabilities.map((a) => ({ name: a })));
  endDuration(durationId);

  // Insert temp data for PoiAccessability
  logger.info('Inserting poi accessabilities to temporary table');
  durationId = startDuration();
  await handler.pois.TempPoiAccessabilityModel
    .query()
    .insert(poiAccessabilities);
  endDuration(durationId);

  // Insert temp data for PoiAccessability
  logger.info('Inserting poi to area temporary table');
  durationId = startDuration();
  await handler.pois.TempPoiToAreaModel
    .query()
    .insert(poiToArea);
  endDuration(durationId);

  // Insert temp data for PoiToGroup
  logger.info('Inserting poi to group temporary table');
  durationId = startDuration();
  await handler.pois.TempPoiToGroupModel
    .query()
    .insert(poiToGroup);
  endDuration(durationId);

  // Insert temp data for PoiToGroup
  logger.info('Inserting poi pictures to temporary table');
  durationId = startDuration();
  await handler.pois.TempPoiPicturesModel
    .query()
    .insert(pictures);
  endDuration(durationId);
}


/**
 * Insert into `poi_type`-table or update if it already exists
 */
async function mergePoiTypes(handler) {
  const { tableName } = handler.pois.TempPoiTypeModel;

  // Merge into prod table
  const sql = [
    'INSERT INTO poi_types (name)',
    'SELECT DISTINCT type',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (name) DO NOTHING',
  ].join('\n');

  logger.info('Creating poi types');
  const durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);
}


/**
 * Insert into `poi`-table or update if it already exists
 */
async function mergePoi(handler) {
  const { tableName } = handler.pois.TempPoiModel;

  // Merge into prod table
  const sql = [
    'INSERT INTO pois (',
    '  id,',
    '  id_legacy_ntb,',
    '  id_ssr,',
    '  "type",',
    '  name,',
    '  name_lower_case,',
    '  description,',
    '  description_plain,',
    '  coordinates,',
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
    '  id,',
    '  id_legacy_ntb,',
    '  id_ssr,',
    '  "type",',
    '  name,',
    '  name_lower_case,',
    '  description,',
    '  description_plain,',
    '  ST_Transform(coordinates, 25833),',
    '  season,',
    '  open,',
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
    '   "id_ssr" = EXCLUDED."id_ssr",',
    '   "type" = EXCLUDED.type,',
    '   "name" = EXCLUDED."name",',
    '   "name_lower_case" = EXCLUDED."name_lower_case",',
    '   "description" = EXCLUDED."description",',
    '   "description_plain" = EXCLUDED."description_plain",',
    '   "coordinates" = EXCLUDED."coordinates",',
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
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Insert into `pois_to_poi_types`-table or update if it already exists
 */
async function mergePoiToPoiTypes(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.pois.TempPoiTypeModel;

  // Set ids on poiLink temp data
  sql = [
    `UPDATE "public"."${tableName}" gl1 SET`,
    '  poi_id = g.id',
    `FROM "public"."${tableName}" gl2`,
    'INNER JOIN public.pois g ON',
    '  g.id_legacy_ntb = gl2.id_poi_legacy_ntb',
    'WHERE',
    '  gl1.id_poi_legacy_ntb = gl2.id_poi_legacy_ntb AND',
    '  gl1.sort_index = gl2.sort_index',
  ].join('\n');

  logger.info('Update ids on poi types temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Remove existing poi to poi type relations
  sql = (`
    DELETE FROM pois_to_poi_types
    WHERE poi_id IN (
      SELECT DISTINCT poi_id FROM "public"."${tableName}"
    )
  `);

  logger.info('Remove existing poi to poi type relations');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO pois_to_poi_types (',
    '  poi_type, poi_id, "primary",',
    '  sort_index, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  type, poi_id, "primary",',
    '  sort_index, :data_source, now(), now()',
    `FROM "public"."${tableName}"`,
  ].join('\n');

  logger.info('Creating or updating pois to poi types');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove poi to poi type relations that no longer exist in legacy-ntb
 */
async function removeDepreactedPoiToPoiTypes(handler) {
  const { tableName } = handler.pois.TempPoiTypeModel;
  const sql = [
    'DELETE FROM public.pois_to_poi_types',
    'USING public.pois_to_poi_types gl',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  gl.poi_id = te.poi_id AND',
    '  gl.sort_index = te.sort_index',
    'WHERE',
    '  te.id_poi_legacy_ntb IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.pois_to_poi_types.poi_id = gl.poi_id AND',
    '  public.pois_to_poi_types.sort_index = gl.sort_index',
  ].join('\n');

  logger.info('Deleting deprecated poi types');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
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

  // Set ids on poiLink temp data
  sql = [
    `UPDATE "public"."${tableName}" gl1 SET`,
    '  poi_id = g.id',
    `FROM "public"."${tableName}" gl2`,
    'INNER JOIN public.pois g ON',
    '  g.id_legacy_ntb = gl2.id_poi_legacy_ntb',
    'WHERE',
    '  gl1.id_poi_legacy_ntb = gl2.id_poi_legacy_ntb AND',
    '  gl1.sort_index = gl2.sort_index',
  ].join('\n');

  logger.info('Update ids on poi links temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO poi_links (',
    '  id, poi_id, title, url,',
    '  sort_index, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  id, poi_id, title, url,',
    '  sort_index, :data_source, now(), now()',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (poi_id, sort_index) DO UPDATE',
    'SET',
    '  title = EXCLUDED.title,',
    '  url = EXCLUDED.url',
  ].join('\n');

  logger.info('Creating or updating poi links');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove poi links that no longer exist in legacy-ntb
 */
async function removeDepreactedPoiLinks(handler) {
  const { tableName } = handler.pois.TempPoiLinkModel;
  const sql = [
    'DELETE FROM public.poi_links',
    'USING public.poi_links gl',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  gl.poi_id = te.poi_id AND',
    '  gl.sort_index = te.sort_index',
    'WHERE',
    '  te.id_poi_legacy_ntb IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.poi_links.poi_id = gl.poi_id AND',
    '  public.poi_links.sort_index = gl.sort_index',
  ].join('\n');

  logger.info('Deleting deprecated poi links');
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
  const { tableName } = handler.pois.TempAccessabilityModel;
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
 * Create new poi accessabilities
 */
async function createPoiAccessabilities(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.pois.TempPoiAccessabilityModel;

  // Set ids on poiAccessability temp data
  sql = [
    `UPDATE "public"."${tableName}" gt1 SET`,
    '  poi_id = g.id',
    `FROM "public"."${tableName}" gt2`,
    'INNER JOIN public.pois g ON',
    '  g.id_legacy_ntb = gt2.id_poi_legacy_ntb',
    'WHERE',
    '  gt1.id_poi_legacy_ntb = gt2.id_poi_legacy_ntb',
  ].join('\n');

  logger.info('Update ids on poi accessability temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Create poi accessability relations
  sql = [
    'INSERT INTO poi_accessabilities (',
    '  accessability_name, poi_id, description, data_source',
    ')',
    'SELECT',
    '  name, poi_id, description, :data_source',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (accessability_name, poi_id) DO NOTHING',
  ].join('\n');

  logger.info('Create new poi accessabilities');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove poi accessabilities that no longer exist in legacy-ntb
 */
async function removeDepreactedPoiAccessabilities(handler) {
  const { tableName } = handler.pois.TempPoiAccessabilityModel;
  const sql = [
    'DELETE FROM public.poi_accessabilities',
    'USING public.poi_accessabilities cf',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  cf.accessability_name = te.name AND',
    '  cf.poi_id = te.poi_id',
    'WHERE',
    '  te.id_poi_legacy_ntb IS NULL AND',
    '  cf.data_source = :data_source AND',
    '  public.poi_accessabilities.accessability_name = cf.accessability_name',
    '  AND public.poi_accessabilities.poi_id = cf.poi_id',
  ].join('\n');

  logger.info('Deleting deprecated poi accessabilities');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Insert into `pois_to_groups`-table or update if it already exists
 */
async function mergePoiToGroup(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.pois.TempPoiToGroupModel;

  // Set ids on poiToGroup temp data
  sql = [
    `UPDATE "public"."${tableName}" a1 SET`,
    '  poi_id = c.id,',
    '  group_id = a.id',
    `FROM "public"."${tableName}" a2`,
    'INNER JOIN public.groups a ON',
    '  a.id_legacy_ntb = a2.group_legacy_id',
    'INNER JOIN public.pois c ON',
    '  c.id_legacy_ntb = a2.poi_legacy_id',
    'WHERE',
    '  a1.group_legacy_id = a2.group_legacy_id AND',
    '  a1.poi_legacy_id = a2.poi_legacy_id',
  ].join('\n');

  logger.info('Update ids on poi-to-group temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO pois_to_groups (',
    '  poi_id, group_id, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  poi_id, group_id, :data_source, now(), now()',
    `FROM "public"."${tableName}"`,
    'WHERE poi_id IS NOT NULL AND group_id IS NOT NULL',
    'ON CONFLICT (poi_id, group_id) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating poi to group relations');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove poi to group relations that no longer exist in legacy-ntb
 */
async function removeDepreactedPoiToGroup(handler) {
  const { tableName } = handler.pois.TempPoiToGroupModel;

  const sql = [
    'DELETE FROM public.pois_to_groups',
    'USING public.pois_to_groups c2a',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  c2a.poi_id = te.poi_id AND',
    '  c2a.group_id = te.group_id',
    'WHERE',
    '  te.group_id IS NULL AND',
    '  c2a.data_source = :data_source AND',
    '  public.pois_to_groups.poi_id = c2a.poi_id AND',
    '  public.pois_to_groups.group_id = c2a.group_id',
  ].join('\n');

  logger.info('Deleting deprecated poi to group relations');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
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

  // Set ids on poiToPoi temp data
  sql = [
    `UPDATE "public"."${tableName}" a1 SET`,
    '  poi_id = a.id',
    `FROM "public"."${tableName}" a2`,
    'INNER JOIN public.pois a ON',
    '  a.id_legacy_ntb = a2.poi_legacy_id',
    'WHERE',
    '  a1.poi_legacy_id = a2.poi_legacy_id AND',
    '  a1.picture_legacy_id = a2.picture_legacy_id',
  ].join('\n');

  logger.info('Update ids on poi-to-pictures temp data');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'UPDATE pictures p1 SET',
    '  poi_id = a.poi_id,',
    '  sort_index = a.sort_index',
    'FROM pictures p2',
    `INNER JOIN "public"."${tableName}" a ON`,
    '  a.picture_legacy_id = p2.id_legacy_ntb',
    'WHERE',
    '  p1.id = p2.id',
  ].join('\n');

  logger.info('Setting poi uuid on pictures');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove pictures that used to belong to an poi in legacy-ntb
 */
async function removeDepreactedPoiPictures(handler) {
  const { tableName } = handler.pois.TempPoiPicturesModel;
  const sql = [
    'DELETE FROM public.pictures',
    'USING public.pictures p2',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  p2.id_legacy_ntb = te.picture_legacy_id',
    'WHERE',
    '  te.picture_legacy_id IS NULL AND',
    '  p2.poi_id IS NOT NULL AND',
    '  p2.data_source = :data_source AND',
    '  public.pictures.id = p2.id',
  ].join('\n');

  logger.info('Deleting deprecated poi pictures');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Mark pois that no longer exist in legacy-ntb as deleted
 */
async function removeDepreactedPoi(handler) {
  const { tableName } = handler.pois.TempPoiModel;
  const sql = [
    'UPDATE public.pois a1 SET',
    '  status = :status',
    'FROM public.pois a2',
    `LEFT JOIN "public"."${tableName}" t ON`,
    '  t.id_legacy_ntb = a2.id_legacy_ntb',
    'WHERE',
    '  t.id_legacy_ntb IS NULL AND',
    '  a1.id = a2.id AND',
    '  a2.data_source = :data_source AND',
    '  a2.status != :status',
  ].join('\n');

  logger.info('Marking deprecated pois as deleted');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
    status: 'deleted',
  });
  endDuration(durationId);
}


/**
 * Process legacy area data and merge it into the postgres database
 */
const process = async (handler, fullHarvest = false) => {
  logger.info('Processing POIs');
  handler.pois = {};

  await createTempTables(handler, false);
  await mergePoiTypes(handler);
  await mergePoi(handler);
  await mergePoiToPoiTypes(handler);
  if (fullHarvest) await removeDepreactedPoiToPoiTypes(handler);
  await mergePoiLinks(handler);
  if (fullHarvest) await removeDepreactedPoiLinks(handler);
  await createAccessabilities(handler);
  await createPoiAccessabilities(handler);
  if (fullHarvest) await removeDepreactedPoiAccessabilities(handler);
  await mergePoiToGroup(handler);
  if (fullHarvest) await removeDepreactedPoiToGroup(handler);
  await setPoiPictures(handler);
  if (fullHarvest) await removeDepreactedPoiPictures(handler);
  if (fullHarvest) await removeDepreactedPoi(handler);
  await dropTempTables(handler);
};


/**
 * Map poi data
 */
export const mapPoiData = async (handler, first = false) => {
  logger.info('Mapping pois');
  handler.pois = {};

  await mapData(handler);
  await createTempTables(handler, first);
  await populateTempTables(handler);
};


export default process;

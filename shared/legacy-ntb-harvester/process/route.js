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
async function createTempTables(handler, sync = false) {
  logger.info('Creating temporary tables');
  const durationId = startDuration();

  const baseTableName = `_temp_legacy_ntb_harvest_${handler.timeStamp}`;

  let tableName = `${baseTableName}_route`;
  handler.routes.TempRouteModel = db.sequelize.define(tableName, {
    uuid: { type: db.Sequelize.UUID, primaryKey: true },
    idLegacyNtb: { type: db.Sequelize.TEXT },
    code: { type: db.Sequelize.TEXT },
    type: { type: db.Sequelize.TEXT },
    name: { type: db.Sequelize.TEXT },
    nameLowerCase: { type: db.Sequelize.TEXT },
    description: { type: db.Sequelize.TEXT },
    descriptionPlain: { type: db.Sequelize.TEXT },
    url: { type: db.Sequelize.TEXT },
    source: { type: db.Sequelize.TEXT },
    notes: { type: db.Sequelize.TEXT },

    grading: { type: db.Sequelize.TEXT },
    suitableForChildren: { type: db.Sequelize.BOOLEAN },
    distance: { type: db.Sequelize.INTEGER },

    waymarkWinterAllYear: { type: db.Sequelize.BOOLEAN },
    waymarkWinterFrom: { type: db.Sequelize.DATE },
    waymarkWinterTo: { type: db.Sequelize.DATE },
    waymarkWinterComment: { type: db.Sequelize.TEXT },

    durationMinutes: { type: db.Sequelize.INTEGER },
    durationHours: { type: db.Sequelize.INTEGER },
    durationDays: { type: db.Sequelize.INTEGER },

    season: { type: db.Sequelize.ARRAY(db.Sequelize.INTEGER) },

    htgtGeneral: { type: db.Sequelize.TEXT },
    htgtPublicTransport: { type: db.Sequelize.TEXT },

    license: { type: db.Sequelize.TEXT },
    provider: { type: db.Sequelize.TEXT },
    status: { type: db.Sequelize.TEXT },
    dataSource: { type: db.Sequelize.TEXT },
    updatedAt: { type: db.Sequelize.DATE },
  }, {
    timestamps: false,
    tableName,
  });
  if (sync) await handler.routes.TempRouteModel.sync();

  tableName = `${baseTableName}_route_types`;
  handler.routes.TempRouteTypeModel =
    db.sequelize.define(tableName, {
      activityType: { type: db.Sequelize.TEXT },
      activitySubType: { type: db.Sequelize.TEXT },
      routeUuid: { type: db.Sequelize.UUID },
      idRouteLegacyNtb: { type: db.Sequelize.TEXT },
      primary: { type: db.Sequelize.BOOLEAN },
      sortIndex: { type: db.Sequelize.INTEGER },
      dataSource: { type: db.Sequelize.TEXT },
      updatedAt: { type: db.Sequelize.DATE },
    }, {
      timestamps: false,
      tableName,
    });
  if (sync) await handler.routes.TempRouteTypeModel.sync();

  tableName = `${baseTableName}_route_wtype`;
  handler.routes.TempRouteWaymarkTypeModel =
    db.sequelize.define(tableName, {
      name: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  if (sync) await handler.routes.TempRouteWaymarkTypeModel.sync();

  tableName = `${baseTableName}_route_route_wtype`;
  handler.routes.TempRouteRouteWaymarkTypeModel =
    db.sequelize.define(tableName, {
      name: { type: db.Sequelize.TEXT },
      idRouteLegacyNtb: { type: db.Sequelize.TEXT },
      routeUuid: { type: db.Sequelize.UUID },
    }, {
      timestamps: false,
      tableName,
    });
  if (sync) await handler.routes.TempRouteRouteWaymarkTypeModel.sync();

  tableName = `${baseTableName}_route_to_county`;
  handler.routes.TempRouteToCountyModel =
    db.sequelize.define(tableName, {
      county_uuid: { type: db.Sequelize.UUID },
      route_uuid: { type: db.Sequelize.UUID },
      routeLegacyId: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.routes.TempRouteToCountyModel.sync();

  endDuration(durationId);
}


/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  await handler.routes.TempRouteModel.drop();
  await handler.routes.TempRouteTypeModel.drop();
  await handler.routes.TempRouteWaymarkTypeModel.drop();
  await handler.routes.TempRouteRouteWaymarkTypeModel.drop();

  endDuration(durationId);
}


/**
 * Send legacy ntb data through a mapper that converts old structure to new
 */
async function mapData(handler) {
  logger.info('Mapping legacy data to new structure');
  const durationId = startDuration();
  const routes = [];

  await Promise.all(
    handler.documents.ruter
      .map(async (d) => {
        // Ignore routes without a type
        if (d.tags && d.tags.length) {
          const m = await legacy.ruter.mapping(d, handler);
          routes.push(m);
        }
      })
  );
  endDuration(durationId);

  handler.routes.processed = routes;
}


/**
 * Populate temporary tables with the processed legacy ntb data
 */
async function populateTempTables(handler) {
  let durationId;

  logger.info('Inserting routes to temporary table');
  durationId = startDuration();
  const routes = handler.routes.processed.map((p) => p.route);
  await handler.routes.TempRouteModel.bulkCreate(routes);
  endDuration(durationId);

  const routeWaymarkTypes = [];
  const routeRouteWaymarkTypes = [];
  const routeToCounty = [];
  let suitableActivityTypes = [];
  handler.routes.processed.forEach((p) => {
    suitableActivityTypes = suitableActivityTypes
      .concat(p.suitableActivityTypes);

    if (p.routeWaymarkTypes) {
      p.routeWaymarkTypes.forEach((facility) => routeWaymarkTypes.push({
        name: facility.name,
      }));

      p.routeWaymarkTypes.forEach((facility) => routeRouteWaymarkTypes.push({
        name: facility.name,
        idRouteLegacyNtb: p.route.idLegacyNtb,
        description: facility.description,
      }));
    }

    if (p.counties) {
      p.counties.forEach((county) => routeToCounty.push({
        countyUuid: county,
        routeLegacyId: p.route.idLegacyNtb,
      }));
    }
  });

  // Insert temp data for route activity types
  logger.info('Inserting route activity types to temporary table');
  durationId = startDuration();
  await handler.routes.TempRouteTypeModel.bulkCreate(suitableActivityTypes);
  endDuration(durationId);

  // Insert temp data for RouteWaymarkType
  logger.info('Inserting route waymark types to temporary table');
  durationId = startDuration();
  await handler.routes.TempRouteWaymarkTypeModel.bulkCreate(routeWaymarkTypes);
  endDuration(durationId);

  // Insert temp data for RouteToRouteWaymarkType
  logger.info(
    'Inserting route to route waymark type relations temporary table'
  );
  durationId = startDuration();
  await handler.routes.TempRouteRouteWaymarkTypeModel.bulkCreate(
    routeRouteWaymarkTypes
  );
  endDuration(durationId);
}

/**
 * Verify that there are max 2 of each route code
 */
async function verifyRouteCodeCount(handler) {
  const { tableName } = handler.routes.TempRouteModel;

  const sql = [
    'SELECT r.code, COUNT(*) cnt',
    `FROM public.${tableName} r`,
    'GROUP BY r.code',
    'HAVING',
    '  COUNT(*) > 2',
  ].join('\n');

  logger.info('Verifying that max 2 instances of each route code exists');
  const durationId = startDuration();
  const res = await db.sequelize.query(sql);
  endDuration(durationId);

  if (res && res[0] && res[0].length) {
    res[0].forEach((err) => {
      logger.error(
        `Route code «${err.code}» is found more that two times in legacy-ntb`
      );
    });

    throw new Error('Invalid route data in legacy-ntb');
  }
}


/**
 * Insert into `activity_type`-table
 */

async function mergeActivityType(handler) {
  const { tableName } = handler.routes.TempRouteTypeModel;

  // Merge primary types into prod table
  let sql = [
    'INSERT INTO activity_type (name, "primary")',
    'SELECT DISTINCT activity_type, TRUE',
    `FROM public.${tableName}`,
    'WHERE activity_type IS NOT NULL',
    'ON CONFLICT (name) DO UPDATE',
    'SET',
    '  "primary" = TRUE',
  ].join('\n');

  logger.info('Creating primary activity types');
  let durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge sub types into prod table
  sql = [
    'INSERT INTO activity_type (name, "primary")',
    'SELECT DISTINCT activity_sub_type, FALSE',
    `FROM public.${tableName}`,
    'WHERE activity_sub_type IS NOT NULL',
    'ON CONFLICT (name) DO NOTHING',
  ].join('\n');

  logger.info('Creating sub activity types');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge primary to sub type relations into prod table
  sql = [
    'INSERT INTO activity_type_to_activity_type (primary_type, sub_type)',
    'SELECT DISTINCT activity_type, activity_sub_type',
    `FROM public.${tableName}`,
    'WHERE activity_sub_type IS NOT NULL AND activity_type IS NOT NULL',
    'ON CONFLICT (primary_type, sub_type) DO NOTHING',
  ].join('\n');

  logger.info('Creating primary to sub activity type relations');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);
}


/**
 * Insert into `route`-table or update if it already exists
 */
async function mergeRoute(handler) {
  const { tableName } = handler.routes.TempRouteModel;

  // Merge into prod table
  const sql = [
    'INSERT INTO route (',
    '  uuid,',
    '  id_legacy_ntb_ab,',
    '  id_legacy_ntb_ba,',
    '  code,',
    '  type,',
    '  name,',
    '  name_lower_case,',
    '  description_ab,',
    '  description_ab_plain,',
    '  description_ba,',
    '  description_ba_plain,',
    '  url,',
    '  source,',
    '  notes,',
    '  grading,',
    '  suitable_for_children,',
    '  distance,',
    '  waymark_winter_all_year,',
    '  waymark_winter_from,',
    '  waymark_winter_to,',
    '  waymark_winter_comment,',
    '  duration_minutes,',
    '  duration_hours,',
    '  duration_days,',
    '  season,',
    '  license,',
    '  provider,',
    '  status,',
    '  data_source,',
    '  updated_at,',
    '  created_at,',
    '  search_document_boost',
    ')',
    'SELECT',
    '  a.uuid,',
    '  a.id_legacy_ntb,',
    '  b.id_legacy_ntb,',
    '  a.code,',
    '  a.type::enum_route_type,',
    '  a.name,',
    '  a.name_lower_case,',
    '  a.description,',
    '  a.description_plain,',
    '  b.description,',
    '  b.description_plain,',
    '  a.url,',
    '  a.source,',
    '  a.notes,',
    '  a.grading::enum_route_grading,',
    '  a.suitable_for_children,',
    '  a.distance,',
    '  a.waymark_winter_all_year,',
    '  a.waymark_winter_from,',
    '  a.waymark_winter_to,',
    '  a.waymark_winter_comment,',
    '  a.duration_minutes,',
    '  a.duration_hours,',
    '  a.duration_days,',
    '  a.season,',
    '  a.license,',
    '  a.provider,',
    '  a.status::enum_route_status,',
    '  :data_source,',
    '  a.updated_at,',
    '  a.updated_at,',
    '  1',
    'FROM (',
    '  SELECT DISTINCT ON (r.code) r.code, r.uuid',
    `  FROM "public".${tableName} r`,
    '  ORDER BY r.code, r.id_legacy_ntb',
    ') r',
    `INNER JOIN "public".${tableName} a`,
    '  ON a.uuid = r.uuid',
    `LEFT JOIN "public".${tableName} b`,
    '  ON b.uuid != r.uuid AND b.code = r.code',
    'ON CONFLICT (id_legacy_ntb_ab) DO UPDATE',
    'SET',
    '   "code" = EXCLUDED."code",',
    '   "type" = EXCLUDED."type",',
    '   "name" = EXCLUDED.name,',
    '   "name_lower_case" = EXCLUDED.name_lower_case,',
    '   "description_ab" = EXCLUDED.description_ab,',
    '   "description_ab_plain" = EXCLUDED.description_ab_plain,',
    '   "description_ba" = EXCLUDED.description_ba,',
    '   "description_ba_plain" = EXCLUDED.description_ba_plain,',
    '   "url" = EXCLUDED.url,',
    '   "source" = EXCLUDED.source,',
    '   "notes" = EXCLUDED.notes,',
    '   "grading" = EXCLUDED.grading,',
    '   "suitable_for_children" = EXCLUDED.suitable_for_children,',
    '   "distance" = EXCLUDED.distance,',
    '   "waymark_winter_all_year" = EXCLUDED.waymark_winter_all_year,',
    '   "waymark_winter_from" = EXCLUDED.waymark_winter_from,',
    '   "waymark_winter_to" = EXCLUDED.waymark_winter_to,',
    '   "waymark_winter_comment" = EXCLUDED.waymark_winter_comment,',
    '   "duration_minutes" = EXCLUDED.duration_minutes,',
    '   "duration_hours" = EXCLUDED.duration_hours,',
    '   "duration_days" = EXCLUDED.duration_days,',
    '   "season" = EXCLUDED.season,',
    '   "license" = EXCLUDED.license,',
    '   "provider" = EXCLUDED.provider,',
    '   "status" = EXCLUDED.status,',
    '   "updated_at" = EXCLUDED.updated_at',
  ].join('\n');

  logger.info('Creating or updating routes');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Create new route to activity type relations
 */
async function createRouteToActivityTypes(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.routes.TempRouteTypeModel;

  // Set UUIDs on route to activity type temp data
  sql = [
    `UPDATE public.${tableName} gt1 SET`,
    '  route_uuid = g.uuid',
    `FROM public.${tableName} gt2`,
    'INNER JOIN public.route g ON',
    '  g.id_legacy_ntb_ab = gt2.id_route_legacy_ntb OR',
    '  g.id_legacy_ntb_ba = gt2.id_route_legacy_ntb',
    'WHERE',
    '  gt1.id_route_legacy_ntb = gt2.id_route_legacy_ntb AND',
    '  gt1.id_route_legacy_ntb IS NOT NULL',
  ].join('\n');

  logger.info('Update uuids on route to activity type temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Create route to activity type relations on primary activity types
  sql = [
    'INSERT INTO route_to_activity_type (',
    '  activity_type_name, route_uuid, sort_index, data_source',
    ')',
    'SELECT DISTINCT ON (activity_type, id_route_legacy_ntb)',
    '  activity_type, route_uuid, sort_index, :data_source',
    `FROM public.${tableName}`,
    'WHERE route_uuid IS NOT NULL',
    'ON CONFLICT (activity_type_name, route_uuid) DO NOTHING',
  ].join('\n');

  logger.info(
    'Create new route to activity type relations on primary activity types'
  );
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);

  // Create route to activity type relations on sub activity types
  sql = [
    'INSERT INTO route_to_activity_type (',
    '  activity_type_name, route_uuid, sort_index, data_source',
    ')',
    'SELECT DISTINCT ON (activity_type, id_route_legacy_ntb)',
    '  activity_sub_type, route_uuid, sort_index, :data_source',
    `FROM public.${tableName}`,
    'WHERE route_uuid IS NOT NULL AND activity_sub_type IS NOT NULL',
    'ON CONFLICT (activity_type_name, route_uuid) DO NOTHING',
  ].join('\n');

  logger.info(
    'Create new route to activity type relations on sub activity types'
  );
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove route to activity type relations that no longer exist in legacy-ntb
 */
async function removeDepreactedRouteToActivityTypes(handler) {
  const { tableName } = handler.routes.TempRouteTypeModel;
  const sql = [
    'DELETE FROM public.route_to_activity_type',
    'USING public.route_to_activity_type cf',
    `LEFT JOIN public.${tableName} te ON`,
    '  (',
    '    cf.activity_type_name = te.activity_type OR',
    '    cf.activity_type_name = te.activity_sub_type',
    '  ) AND',
    '  cf.route_uuid = te.route_uuid',
    'WHERE',
    '  te.id_route_legacy_ntb IS NULL AND',
    '  cf.data_source = :data_source AND',
    '  public.route_to_activity_type.activity_type_name =',
    '    cf.activity_type_name AND',
    '  public.route_to_activity_type.route_uuid = cf.route_uuid',
  ].join('\n');

  logger.info('Deleting deprecated route to activity type relations');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Create new route waymark types
 */
async function createRouteWaymarkTypes(handler) {
  const { tableName } = handler.routes.TempRouteWaymarkTypeModel;
  const sql = [
    'INSERT INTO route_waymark_type (name)',
    'SELECT DISTINCT name',
    `FROM public.${tableName}`,
    'ON CONFLICT (name) DO NOTHING',
  ].join('\n');

  logger.info('Create new route waymark types');
  const durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);
}


/**
 * Create new route to route waymark type relations
 */
async function createRouteToRouteWaymarkTypes(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.routes.TempRouteRouteWaymarkTypeModel;

  // Set UUIDs on RouteWaymarkType temp data
  sql = [
    `UPDATE public.${tableName} gt1 SET`,
    '  route_uuid = g.uuid',
    `FROM public.${tableName} gt2`,
    'INNER JOIN public.route g ON',
    '  g.id_legacy_ntb_ab = gt2.id_route_legacy_ntb OR',
    '  g.id_legacy_ntb_ba = gt2.id_route_legacy_ntb',
    'WHERE',
    '  gt1.id_route_legacy_ntb = gt2.id_route_legacy_ntb AND',
    '  gt1.id_route_legacy_ntb IS NOT NULL',
  ].join('\n');

  logger.info('Update uuids on route to route waymark type temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Create route to route waymark type relations
  sql = [
    'INSERT INTO route_to_route_waymark_type (',
    '  route_waymark_type_name, route_uuid, data_source',
    ')',
    'SELECT',
    '  name, route_uuid, :data_source',
    `FROM public.${tableName}`,
    'WHERE route_uuid IS NOT NULL',
    'ON CONFLICT (route_waymark_type_name, route_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Create new route to route waymark type relations');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove route to route waymark type relations that no longer exist in
 * legacy-ntb
 */
async function removeDepreactedRouteToRouteWaymarkTypes(handler) {
  const { tableName } = handler.routes.TempRouteRouteWaymarkTypeModel;
  const sql = [
    'DELETE FROM public.route_to_route_waymark_type',
    'USING public.route_to_route_waymark_type cf',
    `LEFT JOIN public.${tableName} te ON`,
    '  cf.route_waymark_type_name = te.name AND',
    '  cf.route_uuid = te.route_uuid',
    'WHERE',
    '  te.id_route_legacy_ntb IS NULL AND',
    '  cf.data_source = :data_source AND',
    '  public.route_to_route_waymark_type.route_waymark_type_name =',
    '    cf.route_waymark_type_name AND',
    '  public.route_to_route_waymark_type.route_uuid = cf.route_uuid',
  ].join('\n');

  logger.info('Deleting deprecated route to route waymark type relations');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Insert into `route_to_county`-table or update if it already exists
 */
async function mergeCabinToArea(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.routes.TempRouteToCountyModel;

  // Set UUIDs on cabinToArea temp data
  sql = [
    `UPDATE public.${tableName} a1 SET`,
    '  route_uuid = a.uuid',
    `FROM public.${tableName} a2`,
    'INNER JOIN public.route a ON',
    '  a.id_legacy_ntb_ab = a2.route_legacy_id',
    'WHERE',
    '  a1.route_legacy_id = a2.route_legacy_id AND',
    '  a1.county_uuid = a2.county_uuid',
  ].join('\n');

  logger.info('Update uuids on route-to-county temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO route_to_county (',
    '  route_uuid, county_uuid, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  route_uuid, county_uuid, :data_source, now(), now()',
    `FROM public.${tableName}`,
    'WHERE route_uuid IS NOT NULL AND county_uuid IS NOT NULL',
    'ON CONFLICT (route_uuid, county_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating route to county relations');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove route to county relations that no longer exist in legacy-ntb
 */
async function removeDepreactedRouteToCounty(handler) {
  const { tableName } = handler.routes.TempRouteToCountyModel;

  const sql = [
    'DELETE FROM public.route_to_county',
    'USING public.route_to_county c2a',
    `LEFT JOIN public.${tableName} te ON`,
    '  c2a.route_uuid = te.route_uuid AND',
    '  c2a.county_uuid = te.county_uuid',
    'WHERE',
    '  te.county_uuid IS NULL AND',
    '  c2a.data_source = :data_source AND',
    '  public.route_to_county.route_uuid = c2a.route_uuid AND',
    '  public.route_to_county.county_uuid = c2a.county_uuid',
  ].join('\n');

  logger.info('Deleting deprecated route to county relations');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Process legacy route data and merge it into the postgres database
 */
const process = async (handler, first = false) => {
  logger.info('Processing routes');
  handler.routes = {};

  await createTempTables(handler, false);
  await verifyRouteCodeCount(handler);
  await mergeActivityType(handler);
  await mergeRoute(handler);
  await createRouteWaymarkTypes(handler);
  await createRouteToRouteWaymarkTypes(handler);
  await removeDepreactedRouteToRouteWaymarkTypes(handler);
  await createRouteToActivityTypes(handler);
  await removeDepreactedRouteToActivityTypes(handler);
  await mergeCabinToArea(handler);
  await removeDepreactedRouteToCounty(handler);
  // await dropTempTables(handler);
};


/**
 * Map route data
 */
export const mapRouteData = async (handler, first = false) => {
  logger.info('Mapping routes');
  handler.routes = {};

  await mapData(handler);
  await createTempTables(handler, first);
  await populateTempTables(handler);
};


export default process;

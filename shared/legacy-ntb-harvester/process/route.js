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
    isWinter: { type: db.Sequelize.BOOLEAN },
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

  tableName = `${baseTableName}_route_links`;
  handler.routes.TempRouteLinkModel =
    db.sequelize.define(tableName, {
      uuid: { type: db.Sequelize.UUID, primaryKey: true },
      title: { type: db.Sequelize.TEXT, allowNull: true },
      url: { type: db.Sequelize.TEXT },
      routeUuid: { type: db.Sequelize.UUID, allowNull: true },
      idRouteLegacyNtb: { type: db.Sequelize.TEXT },
      sortIndex: { type: db.Sequelize.INTEGER },
      dataSource: { type: db.Sequelize.TEXT },
      updatedAt: { type: db.Sequelize.DATE },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.routes.TempRouteLinkModel.sync();

  tableName = `${baseTableName}_route_to_group`;
  handler.routes.TempRouteToGroupModel =
    db.sequelize.define(tableName, {
      routeUuid: { type: db.Sequelize.UUID },
      groupUuid: { type: db.Sequelize.UUID },
      routeLegacyId: { type: db.Sequelize.TEXT },
      groupLegacyId: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.routes.TempRouteToGroupModel.sync();

  tableName = `${baseTableName}_route_to_poi`;
  handler.routes.TempRouteToPoiModel =
    db.sequelize.define(tableName, {
      routeUuid: { type: db.Sequelize.UUID },
      poiUuid: { type: db.Sequelize.UUID },
      routeLegacyId: { type: db.Sequelize.TEXT },
      poiLegacyId: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.routes.TempRouteToPoiModel.sync();

  tableName = `${baseTableName}_route_pictures`;
  handler.routes.TempRoutePicturesModel =
    db.sequelize.define(tableName, {
      routeLegacyId: { type: db.Sequelize.TEXT },
      routeUuid: { type: db.Sequelize.UUID },
      pictureLegacyId: { type: db.Sequelize.TEXT },
      sortIndex: { type: db.Sequelize.INTEGER },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.routes.TempRoutePicturesModel.sync();

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
  await handler.routes.TempRouteLinkModel.drop();
  await handler.routes.TempRouteToGroupModel.drop();
  await handler.routes.TempRouteToPoiModel.drop();
  await handler.routes.TempRoutePicturesModel.drop();

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
  const routeToGroup = [];
  const routeToPoi = [];
  const pictures = [];
  let links = [];
  let suitableActivityTypes = [];
  handler.routes.processed.forEach((p) => {
    suitableActivityTypes = suitableActivityTypes
      .concat(p.suitableActivityTypes);
    links = links.concat(p.links);

    p.pictures.forEach((pictureLegacyId, idx) => pictures.push({
      pictureLegacyId,
      routeLegacyId: p.route.idLegacyNtb,
      sortIndex: idx,
    }));

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

    if (p.groups) {
      p.groups.forEach((group) => routeToGroup.push({
        groupLegacyId: group.toString(),
        routeLegacyId: p.route.idLegacyNtb,
      }));
    }

    if (p.pois) {
      p.pois.forEach((poi) => routeToPoi.push({
        poiLegacyId: poi.toString(),
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

  // Insert temp data for RouteLink
  logger.info('Inserting route links to temporary table');
  durationId = startDuration();
  await handler.routes.TempRouteLinkModel.bulkCreate(links);
  endDuration(durationId);

  // Insert temp data for RouteToGroup
  logger.info('Inserting route to group temporary table');
  durationId = startDuration();
  await handler.routes.TempRouteToGroupModel.bulkCreate(routeToGroup);
  endDuration(durationId);

  // Insert temp data for RouteToPoi
  logger.info('Inserting route to poi temporary table');
  durationId = startDuration();
  await handler.routes.TempRouteToPoiModel.bulkCreate(routeToPoi);
  endDuration(durationId);

  // Insert temp data for RouteToPoi
  logger.info('Inserting route pictures to temporary table');
  durationId = startDuration();
  await handler.routes.TempRoutePicturesModel.bulkCreate(pictures);
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
    '  is_winter,',
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
    '  a.is_winter,',
    '  a.name,',
    '  a.name_lower_case,',
    '  a.description,',
    '  a.description_plain,',
    '  b.description,',
    '  b.description_plain,',
    '  a.url,',
    '  a.source,',
    '  a.notes,',
    '  a.grading,',
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
    '  a.status,',
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
    '   "is_winter" = EXCLUDED."is_winter",',
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
    'SELECT DISTINCT ON (activity_type, route_uuid)',
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
    'SELECT DISTINCT ON (activity_sub_type, route_uuid)',
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
 * Insert into `route_link`-table or update if it already exists
 */
async function mergeRouteLinks(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.routes.TempRouteLinkModel;

  // Set UUIDs on routeLink temp data
  sql = [
    `UPDATE public.${tableName} gl1 SET`,
    '  route_uuid = g.uuid',
    `FROM public.${tableName} gl2`,
    'INNER JOIN public.route g ON',
    '  g.id_legacy_ntb_ab = gl2.id_route_legacy_ntb OR',
    '  g.id_legacy_ntb_ba = gl2.id_route_legacy_ntb',
    'WHERE',
    '  gl1.id_route_legacy_ntb = gl2.id_route_legacy_ntb AND',
    '  gl1.sort_index = gl2.sort_index',
  ].join('\n');

  logger.info('Update uuids on route links temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO route_link (',
    '  uuid, route_uuid, title, url,',
    '  sort_index, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  uuid, route_uuid, title, url,',
    '  sort_index, :data_source, now(), now()',
    `FROM public.${tableName}`,
    'ON CONFLICT (route_uuid, sort_index) DO UPDATE',
    'SET',
    '  title = EXCLUDED.title,',
    '  url = EXCLUDED.url',
  ].join('\n');

  logger.info('Creating or updating route links');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove route links that no longer exist in legacy-ntb
 */
async function removeDepreactedRouteLinks(handler) {
  const { tableName } = handler.routes.TempRouteLinkModel;
  const sql = [
    'DELETE FROM public.route_link',
    'USING public.route_link gl',
    `LEFT JOIN public.${tableName} te ON`,
    '  gl.route_uuid = te.route_uuid AND',
    '  gl.sort_index = te.sort_index',
    'WHERE',
    '  te.id_route_legacy_ntb IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.route_link.route_uuid = gl.route_uuid AND',
    '  public.route_link.sort_index = gl.sort_index',
  ].join('\n');

  logger.info('Deleting deprecated route links');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Insert into `route_to_group`-table or update if it already exists
 */
async function mergeRouteToGroup(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.routes.TempRouteToGroupModel;

  // Set UUIDs on routeToGroup temp data
  sql = [
    `UPDATE public.${tableName} a1 SET`,
    '  route_uuid = c.uuid,',
    '  group_uuid = a.uuid',
    `FROM public.${tableName} a2`,
    'INNER JOIN public.group a ON',
    '  a.id_legacy_ntb = a2.group_legacy_id',
    'INNER JOIN public.route c ON',
    '  c.id_legacy_ntb_ab = a2.route_legacy_id',
    'WHERE',
    '  a1.group_legacy_id = a2.group_legacy_id AND',
    '  a1.route_legacy_id = a2.route_legacy_id',
  ].join('\n');

  logger.info('Update uuids on route-to-group temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO route_to_group (',
    '  route_uuid, group_uuid, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  route_uuid, group_uuid, :data_source, now(), now()',
    `FROM public.${tableName}`,
    'WHERE route_uuid IS NOT NULL AND group_uuid IS NOT NULL',
    'ON CONFLICT (route_uuid, group_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating route to group relations');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove route to group relations that no longer exist in legacy-ntb
 */
async function removeDepreactedRouteToGroup(handler) {
  const { tableName } = handler.routes.TempRouteToGroupModel;

  const sql = [
    'DELETE FROM public.route_to_group',
    'USING public.route_to_group c2a',
    `LEFT JOIN public.${tableName} te ON`,
    '  c2a.route_uuid = te.route_uuid AND',
    '  c2a.group_uuid = te.group_uuid',
    'WHERE',
    '  te.group_uuid IS NULL AND',
    '  c2a.data_source = :data_source AND',
    '  public.route_to_group.route_uuid = c2a.route_uuid AND',
    '  public.route_to_group.group_uuid = c2a.group_uuid',
  ].join('\n');

  logger.info('Deleting deprecated route to group relations');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Insert into `route_to_poi`-table or update if it already exists
 */
async function mergeRouteToPoi(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.routes.TempRouteToPoiModel;

  // Set UUIDs on routeToPoi temp data
  sql = [
    `UPDATE public.${tableName} a1 SET`,
    '  route_uuid = c.uuid,',
    '  poi_uuid = a.uuid',
    `FROM public.${tableName} a2`,
    'INNER JOIN public.poi a ON',
    '  a.id_legacy_ntb = a2.poi_legacy_id',
    'INNER JOIN public.route c ON',
    '  c.id_legacy_ntb_ab = a2.route_legacy_id',
    'WHERE',
    '  a1.poi_legacy_id = a2.poi_legacy_id AND',
    '  a1.route_legacy_id = a2.route_legacy_id',
  ].join('\n');

  logger.info('Update uuids on route-to-poi temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO route_to_poi (',
    '  route_uuid, poi_uuid, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  route_uuid, poi_uuid, :data_source, now(), now()',
    `FROM public.${tableName}`,
    'WHERE route_uuid IS NOT NULL AND poi_uuid IS NOT NULL',
    'ON CONFLICT (route_uuid, poi_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating route to poi relations');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove route to poi relations that no longer exist in legacy-ntb
 */
async function removeDepreactedRouteToPoi(handler) {
  const { tableName } = handler.routes.TempRouteToPoiModel;

  const sql = [
    'DELETE FROM public.route_to_poi',
    'USING public.route_to_poi c2a',
    `LEFT JOIN public.${tableName} te ON`,
    '  c2a.route_uuid = te.route_uuid AND',
    '  c2a.poi_uuid = te.poi_uuid',
    'WHERE',
    '  te.poi_uuid IS NULL AND',
    '  c2a.data_source = :data_source AND',
    '  public.route_to_poi.route_uuid = c2a.route_uuid AND',
    '  public.route_to_poi.poi_uuid = c2a.poi_uuid',
  ].join('\n');

  logger.info('Deleting deprecated route to poi relations');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Insert route uuid into `pictures`-table
 */
async function setRoutePictures(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.routes.TempRoutePicturesModel;

  // Set UUIDs on routeToRoute temp data
  sql = [
    `UPDATE public.${tableName} a1 SET`,
    '  route_uuid = a.uuid',
    `FROM public.${tableName} a2`,
    'INNER JOIN public.route a ON',
    '  a.id_legacy_ntb_ab = a2.route_legacy_id OR',
    '  a.id_legacy_ntb_ba = a2.route_legacy_id',
    'WHERE',
    '  a1.route_legacy_id = a2.route_legacy_id AND',
    '  a1.picture_legacy_id = a2.picture_legacy_id',
  ].join('\n');

  logger.info('Update uuids on route-to-picture temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'UPDATE picture p1 SET',
    '  route_uuid = a.route_uuid,',
    '  sort_index = a.sort_index',
    'FROM picture p2',
    `INNER JOIN public.${tableName} a ON`,
    '  a.picture_legacy_id = p2.id_legacy_ntb',
    'WHERE',
    '  p1.uuid = p2.uuid',
  ].join('\n');

  logger.info('Setting route uuid on pictures');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove pictures that used to belong to an route in legacy-ntb
 */
async function removeDepreactedRoutePictures(handler) {
  const { tableName } = handler.routes.TempRoutePicturesModel;
  const sql = [
    'DELETE FROM public.picture',
    'USING public.picture p2',
    `LEFT JOIN public.${tableName} te ON`,
    '  p2.id_legacy_ntb = te.picture_legacy_id',
    'WHERE',
    '  te.picture_legacy_id IS NULL AND',
    '  p2.route_uuid IS NOT NULL AND',
    '  p2.data_source = :data_source AND',
    '  public.picture.uuid = p2.uuid',
  ].join('\n');

  logger.info('Deleting deprecated route pictures');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Mark routes that no longer exist in legacy-ntb as deleted
 */
async function removeDepreactedRoute(handler) {
  const { tableName } = handler.routes.TempRouteModel;
  const sql = [
    'UPDATE public.route a1 SET',
    '  status = :status',
    'FROM public.route a2',
    `LEFT JOIN public.${tableName} t ON`,
    '  t.id_legacy_ntb = a2.id_legacy_ntb_ab OR',
    '  t.id_legacy_ntb = a2.id_legacy_ntb_ba',
    'WHERE',
    '  t.id_legacy_ntb IS NULL AND',
    '  a1.uuid = a2.uuid AND',
    '  a2.data_source = :data_source AND',
    '  a2.status != :status',
  ].join('\n');

  logger.info('Marking deprecated routes as deleted');
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
  await mergeRouteLinks(handler);
  await removeDepreactedRouteLinks(handler);
  await mergeRouteToGroup(handler);
  await removeDepreactedRouteToGroup(handler);
  await mergeRouteToPoi(handler);
  await removeDepreactedRouteToPoi(handler);
  await setRoutePictures(handler);
  await removeDepreactedRoutePictures(handler);
  await removeDepreactedRoute(handler);
  await dropTempTables(handler);
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

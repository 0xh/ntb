import {
  createLogger,
  startDuration,
  endDuration,
} from '@turistforeningen/ntb-shared-utils';
import { knex, Model } from '@turistforeningen/ntb-shared-db-utils';

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

  const baseTableName = `0_${handler.timeStamp}_harlegntb${handler.timeStamp}_harlegntb`;


  // routes
  let tableName = `${baseTableName}_route`;
  if (sync) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('id')
        .primary();
      table.text('idLegacyNtb');
      table.text('code');
      table.boolean('isWinter');
      table.text('name');
      table.text('nameLowerCase');
      table.text('description');
      table.text('descriptionPlain');
      table.text('url');
      table.text('source');
      table.text('notes');
      table.text('grading');
      table.boolean('suitableForChildren');
      table.integer('distance');
      table.text('direction');
      table.boolean('waymarkWinterAllYear');
      table.timestamp('waymarkWinterFrom');
      table.timestamp('waymarkWinterTo');
      table.text('waymarkWinterComment');
      table.integer('durationMinutes');
      table.integer('durationHours');
      table.integer('durationDays');
      table.specificType('season', 'INTEGER[]');
      table.text('license');
      table.text('provider');
      table.text('status');
      table.text('dataSource');
      table.timestamp('updatedAt');
    });
  }

  class TempRouteModel extends Model {
    static tableName = tableName;
  }
  handler.routes.TempRouteModel = TempRouteModel;


  // route types
  tableName = `${baseTableName}_route_types`;
  if (sync) {
    await knex.schema.createTable(tableName, (table) => {
      table.increments();
      table.text('activityType');
      table.text('activitySubType');
      table.uuid('routeId');
      table.text('idRouteLegacyNtb');
      table.boolean('primary');
      table.integer('sortIndex');
      table.text('dataSource');
      table.timestamp('updatedAt');
    });
  }

  class TempRouteTypeModel extends Model {
    static tableName = tableName;
  }
  handler.routes.TempRouteTypeModel = TempRouteTypeModel;


  // route waymark types
  tableName = `${baseTableName}_route_wtype`;
  if (sync) {
    await knex.schema.createTable(tableName, (table) => {
      table.increments();
      table.text('name');
    });
  }

  class TempRouteWaymarkTypeModel extends Model {
    static tableName = tableName;
  }
  handler.routes.TempRouteWaymarkTypeModel = TempRouteWaymarkTypeModel;


  // routed to route waymark types
  tableName = `${baseTableName}_route_wtype_2`;
  if (sync) {
    await knex.schema.createTable(tableName, (table) => {
      table.text('name');
      table.text('idRouteLegacyNtb');
      table.uuid('routeId');

      table.primary(['name', 'idRouteLegacyNtb']);
    });
  }

  class TempRouteRouteWaymarkTypeModel extends Model {
    static tableName = tableName;
    static idColumn = ['name', 'idRouteLegacyNtb'];
  }
  handler.routes.TempRouteRouteWaymarkTypeModel =
    TempRouteRouteWaymarkTypeModel;


  // route links
  tableName = `${baseTableName}_route_links`;
  if (sync) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('id');
      table.text('title');
      table.text('url');
      table.uuid('routeId');
      table.text('idRouteLegacyNtb');
      table.integer('sortIndex');
      table.text('dataSource');
      table.timestamp('updatedAt');
    });
  }

  class TempRouteLinkModel extends Model {
    static tableName = tableName;
  }
  handler.routes.TempRouteLinkModel = TempRouteLinkModel;


  // routes to groups
  tableName = `${baseTableName}_routes_to_groups`;
  if (sync) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('routeId');
      table.uuid('groupId');
      table.text('routeLegacyId');
      table.text('groupLegacyId');

      table.primary(['routeLegacyId', 'groupLegacyId']);
    });
  }

  class TempRouteToGroupModel extends Model {
    static tableName = tableName;
    static idColumn = ['routeLegacyId', 'groupLegacyId'];
  }
  handler.routes.TempRouteToGroupModel = TempRouteToGroupModel;


  // routes to pois
  tableName = `${baseTableName}_routes_to_poiss`;
  if (sync) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('routeId');
      table.uuid('poiId');
      table.text('routeLegacyId');
      table.text('poiLegacyId');

      table.primary(['routeLegacyId', 'poiLegacyId']);
    });
  }

  class TempRouteToPoiModel extends Model {
    static tableName = tableName;
    static idColumn = ['routeLegacyId', 'poiLegacyId'];
  }
  handler.routes.TempRouteToPoiModel = TempRouteToPoiModel;


  // routes pictures
  tableName = `${baseTableName}_route_pic`;
  if (sync) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('routeId');
      table.text('routeLegacyId');
      table.text('pictureLegacyId');
      table.integer('sortIndex');

      table.primary(['routeLegacyId', 'pictureLegacyId']);
    });
  }

  class TempRoutePicturesModel extends Model {
    static tableName = tableName;
    static idColumn = ['routeLegacyId', 'pictureLegacyId'];
  }
  handler.routes.TempRoutePicturesModel = TempRoutePicturesModel;


  endDuration(durationId);
}


/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  await knex.schema
    .dropTableIfExists(handler.routes.TempRouteModel.tableName)
    .dropTableIfExists(handler.routes.TempRouteTypeModel.tableName)
    .dropTableIfExists(handler.routes.TempRouteWaymarkTypeModel.tableName)
    .dropTableIfExists(handler.routes.TempRouteRouteWaymarkTypeModel.tableName)
    .dropTableIfExists(handler.routes.TempRouteLinkModel.tableName)
    .dropTableIfExists(handler.routes.TempRouteToGroupModel.tableName)
    .dropTableIfExists(handler.routes.TempRouteToPoiModel.tableName)
    .dropTableIfExists(handler.routes.TempRoutePicturesModel.tableName);

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
  const routes = handler.routes.processed.map((p) => {
    const { route } = p;
    return route;
  });
  await handler.routes.TempRouteModel
    .query()
    .insert(routes);
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
  await handler.routes.TempRouteTypeModel
    .query()
    .insert(suitableActivityTypes);
  endDuration(durationId);

  // Insert temp data for RouteWaymarkType
  logger.info('Inserting route waymark types to temporary table');
  durationId = startDuration();
  await handler.routes.TempRouteWaymarkTypeModel
    .query()
    .insert(routeWaymarkTypes);
  endDuration(durationId);

  // Insert temp data for RouteToRouteWaymarkType
  logger.info(
    'Inserting route to route waymark type relations temporary table'
  );
  durationId = startDuration();
  await handler.routes.TempRouteRouteWaymarkTypeModel
    .query()
    .insert(routeRouteWaymarkTypes);
  endDuration(durationId);

  // Insert temp data for RouteLink
  logger.info('Inserting route links to temporary table');
  durationId = startDuration();
  await handler.routes.TempRouteLinkModel
    .query()
    .insert(links);
  endDuration(durationId);

  // Insert temp data for RouteToGroup
  logger.info('Inserting route to group temporary table');
  durationId = startDuration();
  await handler.routes.TempRouteToGroupModel
    .query()
    .insert(routeToGroup);
  endDuration(durationId);

  // Insert temp data for RouteToPoi
  logger.info('Inserting route to poi temporary table');
  durationId = startDuration();
  await handler.routes.TempRouteToPoiModel
    .query()
    .insert(routeToPoi);
  endDuration(durationId);

  // Insert temp data for RouteToPoi
  logger.info('Inserting route pictures to temporary table');
  durationId = startDuration();
  await handler.routes.TempRoutePicturesModel
    .query()
    .insert(pictures);
  endDuration(durationId);
}


/**
 * Verify that there are max 2 of each route code
 */
async function verifyRouteCodeCount(handler) {
  const { tableName } = handler.routes.TempRouteModel;

  logger.info('Verifying that max 2 instances of each route code exists');
  const durationId = startDuration();

  const res = await knex({ r: tableName })
    .select({
      code: 'r.code',
      cnt: knex.raw('COUNT(*)'),
    })
    .groupBy('r.code')
    .having(knex.raw('COUNT(*) > 2'));

  endDuration(durationId);

  if (res && res.length > 0) {
    res.forEach((err) => {
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
    'INSERT INTO activity_types (name, "primary")',
    'SELECT DISTINCT activity_type, TRUE',
    `FROM "public"."${tableName}"`,
    'WHERE activity_type IS NOT NULL',
    'ON CONFLICT (name) DO UPDATE',
    'SET',
    '  "primary" = TRUE',
  ].join('\n');

  logger.info('Creating primary activity types');
  let durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Merge sub types into prod table
  sql = [
    'INSERT INTO activity_types (name, "primary")',
    'SELECT DISTINCT activity_sub_type, FALSE',
    `FROM "public"."${tableName}"`,
    'WHERE activity_sub_type IS NOT NULL',
    'ON CONFLICT (name) DO NOTHING',
  ].join('\n');

  logger.info('Creating sub activity types');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);

  // Merge primary to sub type relations into prod table
  sql = [
    'INSERT INTO activity_types_to_activity_types (primary_type, sub_type)',
    'SELECT DISTINCT activity_type, activity_sub_type',
    `FROM "public"."${tableName}"`,
    'WHERE activity_sub_type IS NOT NULL AND activity_type IS NOT NULL',
    'ON CONFLICT (primary_type, sub_type) DO NOTHING',
  ].join('\n');

  logger.info('Creating primary to sub activity type relations');
  durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);
}


/**
 * Insert into `route`-table or update if it already exists
 */
async function mergeRoute(handler) {
  const { tableName } = handler.routes.TempRouteModel;

  // Merge into prod table
  const sql = [
    'INSERT INTO routes (',
    '  id,',
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
    '  a.id,',
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
    '  SELECT DISTINCT ON (r.code) r.code, r.id',
    `  FROM "public"."${tableName}" r`,
    '  ORDER BY r.code, r.id_legacy_ntb',
    ') r',
    `INNER JOIN "public"."${tableName}" a`,
    '  ON a.id = r.id',
    `LEFT JOIN "public"."${tableName}" b`,
    '  ON b.id != r.id AND b.code = r.code',
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
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Create new route to activity type relations
 */
async function createRouteToActivityTypes(handler) {
  let durationId;
  let sql;
  const { tableName } = handler.routes.TempRouteTypeModel;

  // Set ids on route to activity type temp data
  sql = [
    `UPDATE "public"."${tableName}" gt1 SET`,
    '  route_id = g.id',
    `FROM "public"."${tableName}" gt2`,
    'INNER JOIN public.routes g ON',
    '  g.id_legacy_ntb_ab = gt2.id_route_legacy_ntb OR',
    '  g.id_legacy_ntb_ba = gt2.id_route_legacy_ntb',
    'WHERE',
    '  gt1.id_route_legacy_ntb = gt2.id_route_legacy_ntb AND',
    '  gt1.id_route_legacy_ntb IS NOT NULL',
  ].join('\n');

  logger.info('Update ids on route to activity type temp data');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);

  // Create route to activity type relations on primary activity types
  sql = [
    'INSERT INTO routes_to_activity_types (',
    '  activity_type_name, route_id, sort_index, data_source',
    ')',
    'SELECT DISTINCT ON (activity_type, route_id)',
    '  activity_type, route_id, sort_index, :data_source',
    `FROM public."${tableName}"`,
    'WHERE route_id IS NOT NULL',
    'ON CONFLICT (activity_type_name, route_id) DO NOTHING',
  ].join('\n');

  logger.info(
    'Create new route to activity type relations on primary activity types'
  );
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);

  // Create route to activity type relations on sub activity types
  sql = [
    'INSERT INTO routes_to_activity_types (',
    '  activity_type_name, route_id, sort_index, data_source',
    ')',
    'SELECT DISTINCT ON (activity_sub_type, route_id)',
    '  activity_sub_type, route_id, sort_index, :data_source',
    `FROM public."${tableName}"`,
    'WHERE route_id IS NOT NULL AND activity_sub_type IS NOT NULL',
    'ON CONFLICT (activity_type_name, route_id) DO NOTHING',
  ].join('\n');

  logger.info(
    'Create new route to activity type relations on sub activity types'
  );
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove route to activity type relations that no longer exist in legacy-ntb
 */
async function removeDepreactedRouteToActivityTypes(handler) {
  const { tableName } = handler.routes.TempRouteTypeModel;
  const sql = [
    'DELETE FROM public.routes_to_activity_types',
    'USING public.routes_to_activity_types cf',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  (',
    '    cf.activity_type_name = te.activity_type OR',
    '    cf.activity_type_name = te.activity_sub_type',
    '  ) AND',
    '  cf.route_id = te.route_id',
    'WHERE',
    '  te.id_route_legacy_ntb IS NULL AND',
    '  cf.data_source = :data_source AND',
    '  public.routes_to_activity_types.activity_type_name =',
    '    cf.activity_type_name AND',
    '  public.routes_to_activity_types.route_id = cf.route_id',
  ].join('\n');

  logger.info('Deleting deprecated route to activity type relations');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Create new route waymark types
 */
async function createRouteWaymarkTypes(handler) {
  const { tableName } = handler.routes.TempRouteWaymarkTypeModel;
  const sql = [
    'INSERT INTO route_waymark_types (name)',
    'SELECT DISTINCT name',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (name) DO NOTHING',
  ].join('\n');

  logger.info('Create new route waymark types');
  const durationId = startDuration();
  await knex.raw(sql);
  endDuration(durationId);
}


/**
 * Create new route to route waymark type relations
 */
async function createRouteToRouteWaymarkTypes(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.routes.TempRouteRouteWaymarkTypeModel;

  // Set ids on RouteWaymarkType temp data
  sql = [
    `UPDATE "public"."${tableName}" gt1 SET`,
    '  route_id = g.id',
    `FROM "public"."${tableName}" gt2`,
    'INNER JOIN public.routes g ON',
    '  g.id_legacy_ntb_ab = gt2.id_route_legacy_ntb OR',
    '  g.id_legacy_ntb_ba = gt2.id_route_legacy_ntb',
    'WHERE',
    '  gt1.id_route_legacy_ntb = gt2.id_route_legacy_ntb AND',
    '  gt1.id_route_legacy_ntb IS NOT NULL',
  ].join('\n');

  logger.info('Update ids on route to route waymark type temp data');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);

  // Create route to route waymark type relations
  sql = [
    'INSERT INTO routes_to_route_waymark_types (',
    '  route_waymark_type_name, route_id, data_source',
    ')',
    'SELECT',
    '  name, route_id, :data_source',
    `FROM public."${tableName}"`,
    'WHERE route_id IS NOT NULL',
    'ON CONFLICT (route_waymark_type_name, route_id) DO NOTHING',
  ].join('\n');

  logger.info('Create new route to route waymark type relations');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
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
    'DELETE FROM public.routes_to_route_waymark_types',
    'USING public.routes_to_route_waymark_types cf',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  cf.route_waymark_type_name = te.name AND',
    '  cf.route_id = te.route_id',
    'WHERE',
    '  te.id_route_legacy_ntb IS NULL AND',
    '  cf.data_source = :data_source AND',
    '  public.routes_to_route_waymark_types.route_waymark_type_name =',
    '    cf.route_waymark_type_name AND',
    '  public.routes_to_route_waymark_types.route_id = cf.route_id',
  ].join('\n');

  logger.info('Deleting deprecated route to route waymark type relations');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Insert into `route_link`-table or update if it already exists
 */
async function mergeRouteLinks(handler) {
  let durationId;
  let sql;
  const { tableName } = handler.routes.TempRouteLinkModel;

  // Set ids on routeLink temp data
  sql = [
    `UPDATE "public"."${tableName}" gl1 SET`,
    '  route_id = g.id',
    `FROM "public"."${tableName}" gl2`,
    'INNER JOIN public.routes g ON',
    '  g.id_legacy_ntb_ab = gl2.id_route_legacy_ntb OR',
    '  g.id_legacy_ntb_ba = gl2.id_route_legacy_ntb',
    'WHERE',
    '  gl1.id_route_legacy_ntb = gl2.id_route_legacy_ntb AND',
    '  gl1.sort_index = gl2.sort_index',
  ].join('\n');

  logger.info('Update ids on route links temp data');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO route_links (',
    '  id, route_id, title, url,',
    '  sort_index, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  id, route_id, title, url,',
    '  sort_index, :data_source, now(), now()',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (route_id, sort_index) DO UPDATE',
    'SET',
    '  title = EXCLUDED.title,',
    '  url = EXCLUDED.url',
  ].join('\n');

  logger.info('Creating or updating route links');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove route links that no longer exist in legacy-ntb
 */
async function removeDepreactedRouteLinks(handler) {
  const { tableName } = handler.routes.TempRouteLinkModel;
  const sql = [
    'DELETE FROM public.route_links',
    'USING public.route_links gl',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  gl.route_id = te.route_id AND',
    '  gl.sort_index = te.sort_index',
    'WHERE',
    '  te.id_route_legacy_ntb IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.route_links.route_id = gl.route_id AND',
    '  public.route_links.sort_index = gl.sort_index',
  ].join('\n');

  logger.info('Deleting deprecated route links');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Insert into `routes_to_groups`-table or update if it already exists
 */
async function mergeRouteToGroup(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.routes.TempRouteToGroupModel;

  // Set ids on routeToGroup temp data
  sql = [
    `UPDATE "public"."${tableName}" a1 SET`,
    '  route_id = c.id,',
    '  group_id = a.id',
    `FROM "public"."${tableName}" a2`,
    'INNER JOIN public.groups a ON',
    '  a.id_legacy_ntb = a2.group_legacy_id',
    'INNER JOIN public.routes c ON',
    '  c.id_legacy_ntb_ab = a2.route_legacy_id',
    'WHERE',
    '  a1.group_legacy_id = a2.group_legacy_id AND',
    '  a1.route_legacy_id = a2.route_legacy_id',
  ].join('\n');

  logger.info('Update ids on route-to-group temp data');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO routes_to_groups (',
    '  route_id, group_id, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  route_id, group_id, :data_source, now(), now()',
    `FROM public."${tableName}"`,
    'WHERE route_id IS NOT NULL AND group_id IS NOT NULL',
    'ON CONFLICT (route_id, group_id) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating route to group relations');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove route to group relations that no longer exist in legacy-ntb
 */
async function removeDepreactedRouteToGroup(handler) {
  const { tableName } = handler.routes.TempRouteToGroupModel;

  const sql = [
    'DELETE FROM public.routes_to_groups',
    'USING public.routes_to_groups c2a',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  c2a.route_id = te.route_id AND',
    '  c2a.group_id = te.group_id',
    'WHERE',
    '  te.group_id IS NULL AND',
    '  c2a.data_source = :data_source AND',
    '  public.routes_to_groups.route_id = c2a.route_id AND',
    '  public.routes_to_groups.group_id = c2a.group_id',
  ].join('\n');

  logger.info('Deleting deprecated route to group relations');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Insert into `routes_to_pois`-table or update if it already exists
 */
async function mergeRouteToPoi(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.routes.TempRouteToPoiModel;

  // Set ids on routeToPoi temp data
  sql = [
    `UPDATE "public"."${tableName}" a1 SET`,
    '  route_id = c.id,',
    '  poi_id = a.id',
    `FROM "public"."${tableName}" a2`,
    'INNER JOIN public.pois a ON',
    '  a.id_legacy_ntb = a2.poi_legacy_id',
    'INNER JOIN public.routes c ON',
    '  c.id_legacy_ntb_ab = a2.route_legacy_id',
    'WHERE',
    '  a1.poi_legacy_id = a2.poi_legacy_id AND',
    '  a1.route_legacy_id = a2.route_legacy_id',
  ].join('\n');

  logger.info('Update ids on route-to-poi temp data');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO routes_to_pois (',
    '  route_id, poi_id, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  route_id, poi_id, :data_source, now(), now()',
    `FROM public."${tableName}"`,
    'WHERE route_id IS NOT NULL AND poi_id IS NOT NULL',
    'ON CONFLICT (route_id, poi_id) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating route to poi relations');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove route to poi relations that no longer exist in legacy-ntb
 */
async function removeDepreactedRouteToPoi(handler) {
  const { tableName } = handler.routes.TempRouteToPoiModel;

  const sql = [
    'DELETE FROM public.routes_to_pois',
    'USING public.routes_to_pois c2a',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  c2a.route_id = te.route_id AND',
    '  c2a.poi_id = te.poi_id',
    'WHERE',
    '  te.poi_id IS NULL AND',
    '  c2a.data_source = :data_source AND',
    '  public.routes_to_pois.route_id = c2a.route_id AND',
    '  public.routes_to_pois.poi_id = c2a.poi_id',
  ].join('\n');

  logger.info('Deleting deprecated route to poi relations');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Insert route id into `pictures`-table
 */
async function setRoutePictures(handler) {
  let durationId;
  let sql;
  const { tableName } = handler.routes.TempRoutePicturesModel;

  // Set ids on routeToRoute temp data
  sql = [
    `UPDATE "public"."${tableName}" a1 SET`,
    '  route_id = a.id',
    `FROM "public"."${tableName}" a2`,
    'INNER JOIN public.routes a ON',
    '  a.id_legacy_ntb_ab = a2.route_legacy_id OR',
    '  a.id_legacy_ntb_ba = a2.route_legacy_id',
    'WHERE',
    '  a1.route_legacy_id = a2.route_legacy_id AND',
    '  a1.picture_legacy_id = a2.picture_legacy_id',
  ].join('\n');

  logger.info('Update ids on route-to-picture temp data');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);


  // Merge into prod table
  sql = [
    'UPDATE pictures p1 SET',
    '  route_id = a.route_id,',
    '  sort_index = a.sort_index',
    'FROM pictures p2',
    `INNER JOIN "public"."${tableName}" a ON`,
    '  a.picture_legacy_id = p2.id_legacy_ntb',
    'WHERE',
    '  p1.id = p2.id',
  ].join('\n');

  logger.info('Setting route id on pictures');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Remove pictures that used to belong to an route in legacy-ntb
 */
async function removeDepreactedRoutePictures(handler) {
  const { tableName } = handler.routes.TempRoutePicturesModel;
  const sql = [
    'DELETE FROM public.pictures',
    'USING public.pictures p2',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  p2.id_legacy_ntb = te.picture_legacy_id',
    'WHERE',
    '  te.picture_legacy_id IS NULL AND',
    '  p2.route_id IS NOT NULL AND',
    '  p2.data_source = :data_source AND',
    '  public.pictures.id = p2.id',
  ].join('\n');

  logger.info('Deleting deprecated route pictures');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  endDuration(durationId);
}


/**
 * Mark routes that no longer exist in legacy-ntb as deleted
 */
async function removeDepreactedRoute(handler) {
  const { tableName } = handler.routes.TempRouteModel;
  const sql = [
    'UPDATE public.routes a1 SET',
    '  status = :status',
    'FROM public.routes a2',
    `LEFT JOIN "public"."${tableName}" t ON`,
    '  t.id_legacy_ntb = a2.id_legacy_ntb_ab OR',
    '  t.id_legacy_ntb = a2.id_legacy_ntb_ba',
    'WHERE',
    '  t.id_legacy_ntb IS NULL AND',
    '  a1.id = a2.id AND',
    '  a2.data_source = :data_source AND',
    '  a2.status != :status',
  ].join('\n');

  logger.info('Marking deprecated routes as deleted');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
    status: 'deleted',
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

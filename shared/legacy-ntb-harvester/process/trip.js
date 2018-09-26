import {
  Logger,
  startDuration,
  printDuration,
} from '@ntb/utils';
import { knex, Model } from '@ntb/db-utils';
import { geomFromGeoJSON } from '@ntb/gis-utils';

import * as legacy from '../legacy-structure/';


const logger = Logger.getLogger();
const DATASOURCE_NAME = 'legacy-ntb';


/**
 * Create temporary tables that will hold the processed data harvested from
 * legacy-ntb
 */
async function createTempTables(handler, sync = false) {
  logger.info('Creating temporary tables');
  const durationId = startDuration();

  const baseTableName = `0_${handler.timeStamp}_harlegntb`;

  // pois
  let tableName = `${baseTableName}_trips`;
  if (sync) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('id')
        .primary();
      table.text('idLegacyNtb');
      table.text('activityType');
      table.text('name');
      table.text('nameLowerCase');
      table.text('description');
      table.text('descriptionPlain');
      table.text('url');
      table.text('grading');
      table.boolean('suitableForChildren');
      table.integer('distance');
      table.text('direction');
      table.integer('durationMinutes');
      table.integer('durationHours');
      table.integer('durationDays');
      table.specificType('startingPoint', 'GEOMETRY(Point, 4326)');
      table.specificType('path', 'GEOMETRY(LineString, 4326)');
      table.text('pathPolyline');
      table.specificType('season', 'INTEGER[]');
      table.text('htgtGeneral');
      table.text('htgtWinter');
      table.text('htgtSummer');
      table.text('htgtPublicTransport');
      table.boolean('htgtCarAllYear');
      table.boolean('htgtCarSummer');
      table.boolean('htgtBicycle');
      table.boolean('htgtPublicTransportAvailable');
      table.boolean('htgtBoatTransportAvailable');
      table.text('license');
      table.text('provider');
      table.text('status');
      table.text('dataSource');
      table.timestamp('updatedAt');
    });
  }

  class TempTripModel extends Model {
    static tableName = tableName;
  }
  handler.trips.TempTripModel = TempTripModel;


  // trip activity types
  tableName = `${baseTableName}_trip_acttype`;
  if (sync) {
    await knex.schema.createTable(tableName, (table) => {
      table.increments();
      table.text('activityType');
      table.text('activitySubType');
      table.uuid('tripId');
      table.text('idTripLegacyNtb');
      table.boolean('primary');
      table.integer('sortIndex');
      table.text('dataSource');
      table.timestamp('updatedAt');
    });
  }

  class TempTripTypeModel extends Model {
    static tableName = tableName;
  }
  handler.trips.TempTripTypeModel = TempTripTypeModel;


  // trip links
  tableName = `${baseTableName}_trip_linkss`;
  if (sync) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('id')
        .primary();
      table.text('title');
      table.text('url');
      table.uuid('tripId');
      table.text('idTripLegacyNtb');
      table.integer('sortIndex');
      table.text('dataSource');
      table.timestamp('updatedAt');
    });
  }

  class TempTripLinkModel extends Model {
    static tableName = tableName;
  }
  handler.trips.TempTripLinkModel = TempTripLinkModel;


  // trips to groups
  tableName = `${baseTableName}_trip_group`;
  if (sync) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('tripId');
      table.uuid('groupId');
      table.text('tripLegacyId');
      table.text('groupLegacyId');

      table.primary(['tripLegacyId', 'groupLegacyId']);
    });
  }

  class TempTripToGroupModel extends Model {
    static tableName = tableName;
    static idColumn = ['tripLegacyId', 'groupLegacyId'];
  }
  handler.trips.TempTripToGroupModel = TempTripToGroupModel;


  // trips to pois
  tableName = `${baseTableName}_trip_poi`;
  if (sync) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('tripId');
      table.uuid('poiId');
      table.text('tripLegacyId');
      table.text('poiLegacyId');

      table.primary(['tripLegacyId', 'poiLegacyId']);
    });
  }

  class TempTripToPoiModel extends Model {
    static tableName = tableName;
    static idColumn = ['tripLegacyId', 'poiLegacyId'];
  }
  handler.trips.TempTripToPoiModel = TempTripToPoiModel;


  // trip pics
  tableName = `${baseTableName}_trip_pic`;
  if (sync) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('tripId');
      table.text('tripLegacyId');
      table.text('pictureLegacyId');
      table.integer('sortIndex');

      table.primary(['tripLegacyId', 'pictureLegacyId']);
    });
  }

  class TempTripPicturesModel extends Model {
    static tableName = tableName;
    static idColumn = ['tripLegacyId', 'pictureLegacyId'];
  }
  handler.trips.TempTripPicturesModel = TempTripPicturesModel;


  // accessabilities
  tableName = `${baseTableName}_trip_acc`;
  if (sync) {
    await knex.schema.createTable(tableName, (table) => {
      table.text('name')
        .primary();
    });
  }

  class TempAccessabilityModel extends Model {
    static tableName = tableName;
    static idColumn = 'name';
  }
  handler.trips.TempAccessabilityModel = TempAccessabilityModel;


  // trip accessabilities
  tableName = `${baseTableName}_trip_acc_2`;
  if (sync) {
    await knex.schema.createTable(tableName, (table) => {
      table.text('name');
      table.text('idTripLegacyNtb');
      table.uuid('tripId');
      table.text('description');

      table.primary(['name', 'idTripLegacyNtb']);
    });
  }

  class TempTripAccessabilityModel extends Model {
    static tableName = tableName;
    static idColumn = ['name', 'idTripLegacyNtb'];
  }
  handler.trips.TempTripAccessabilityModel = TempTripAccessabilityModel;


  printDuration(durationId);
}


/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  knex.schema
    .dropTableIfExists(handler.trips.TempTripModel.tableName)
    .dropTableIfExists(handler.trips.TempTripTypeModel.tableName)
    .dropTableIfExists(handler.trips.TempTripLinkModel.tableName)
    .dropTableIfExists(handler.trips.TempTripToGroupModel.tableName)
    .dropTableIfExists(handler.trips.TempTripToPoiModel.tableName)
    .dropTableIfExists(handler.trips.TempAccessabilityModel.tableName)
    .dropTableIfExists(handler.trips.TempTripAccessabilityModel.tableName)
    .dropTableIfExists(handler.trips.TempTripPicturesModel.tableName);

  printDuration(durationId);
}


/**
 * Send legacy ntb data through a mapper that converts old structure to new
 */
async function mapData(handler) {
  logger.info('Mapping legacy data to new structure');
  const durationId = startDuration();
  const trips = [];

  await Promise.all(
    handler.documents.turer
      .map(async (d) => {
        // Ignore trips without a type
        if (d.tags && d.tags.length) {
          const m = await legacy.turer.mapping(d, handler);
          trips.push(m);
        }
      })
  );
  printDuration(durationId);

  handler.trips.processed = trips;
}


/**
 * Populate temporary tables with the processed legacy ntb data
 */
async function populateTempTables(handler) {
  let durationId;

  logger.info('Inserting trips to temporary table');
  durationId = startDuration();
  const trips = handler.trips.processed.map((p) => {
    const { trip } = p;
    if (trip.startingPoint) {
      trip.startingPoint = geomFromGeoJSON(trip.startingPoint);
    }
    if (trip.path) {
      trip.path = geomFromGeoJSON(trip.path);
    }
    return trip;
  });
  await handler.trips.TempTripModel
    .query()
    .insert(trips);
  printDuration(durationId);

  const tripToGroup = [];
  const tripToPoi = [];
  const pictures = [];
  const accessabilities = [];
  const foundAccessabilities = [];
  const tripAccessabilities = [];
  let links = [];
  let activitySubTypes = [];
  handler.trips.processed.forEach((p) => {
    activitySubTypes = activitySubTypes.concat(p.activitySubTypes);
    links = links.concat(p.links);

    p.pictures.forEach((pictureLegacyId, idx) => {
      const exists = pictures
        .some((pic) => (
          pic.pictureLegacyId === pictureLegacyId
          && pic.tripLegacyId === p.trip.idLegacyNtb
        ));

      if (!exists) {
        pictures.push({
          pictureLegacyId,
          tripLegacyId: p.trip.idLegacyNtb,
          sortIndex: idx,
        });
      }
    });

    if (p.groups) {
      p.groups.forEach((group) => tripToGroup.push({
        groupLegacyId: group.toString(),
        tripLegacyId: p.trip.idLegacyNtb,
      }));
    }

    if (p.pois) {
      p.pois.forEach((poi) => tripToPoi.push({
        poiLegacyId: poi.toString(),
        tripLegacyId: p.trip.idLegacyNtb,
      }));
    }

    if (p.accessibility) {
      p.accessibility.forEach((accessability) => {
        if (!foundAccessabilities.includes(accessability.name)) {
          accessabilities.push({
            name: accessability.name,
          });
          foundAccessabilities.push(accessability.name);
        }
      });

      p.accessibility.forEach((accessability) => tripAccessabilities.push({
        name: accessability.name,
        nameLowerCase: accessability.nameLowerCase,
        idTripLegacyNtb: p.trip.idLegacyNtb,
        description: accessability.description,
      }));
    }
  });

  // Insert temp data for trip activity types
  logger.info('Inserting trip activity types to temporary table');
  durationId = startDuration();
  await handler.trips.TempTripTypeModel
    .query()
    .insert(activitySubTypes);
  printDuration(durationId);

  // Insert temp data for Accessability
  // logger.info('Inserting accessabilities to temporary table');
  // durationId = startDuration();
  // await handler.trips.TempAccessabilityModel
  //   .query()
  //   .insert(accessabilities);
  // printDuration(durationId);

  // Insert temp data for TripAccessability
  logger.info('Inserting trip accessabilities to temporary table');
  durationId = startDuration();
  await handler.trips.TempTripAccessabilityModel
    .query()
    .insert(tripAccessabilities);
  printDuration(durationId);

  // Insert temp data for TripLink
  logger.info('Inserting trip links to temporary table');
  durationId = startDuration();
  await handler.trips.TempTripLinkModel
    .query()
    .insert(links);
  printDuration(durationId);

  // Insert temp data for TripToGroup
  logger.info('Inserting trip to group temporary table');
  durationId = startDuration();
  await handler.trips.TempTripToGroupModel
    .query()
    .insert(tripToGroup);
  printDuration(durationId);

  // Insert temp data for TripToPoi
  logger.info('Inserting trip to poi temporary table');
  durationId = startDuration();
  await handler.trips.TempTripToPoiModel
    .query()
    .insert(tripToPoi);
  printDuration(durationId);

  // Insert temp data for TripToPoi
  logger.info('Inserting trip pictures to temporary table');
  durationId = startDuration();
  await handler.trips.TempTripPicturesModel
    .query()
    .insert(pictures);
  printDuration(durationId);
}


/**
 * Insert into `activity_type`-table
 */

async function mergeActivityType(handler) {
  let { tableName } = handler.trips.TempTripModel;

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
  printDuration(durationId);

  // Merge sub types into prod table
  ({ tableName } = handler.trips.TempTripTypeModel);
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
  printDuration(durationId);

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
  printDuration(durationId);
}


/**
 * Insert into `trip`-table or update if it already exists
 */
async function mergeTrip(handler) {
  const { tableName } = handler.trips.TempTripModel;

  // Merge into prod table
  const sql = `
    INSERT INTO trips (
      id,
      id_legacy_ntb,
      activity_type,
      name,
      name_lower_case,
      description,
      description_plain,
      grading,
      suitable_for_children,
      distance,
      direction,
      duration_minutes,
      duration_hours,
      duration_days,
      starting_point,
      path,
      path_polyline,
      season,
      htgt_general,
      htgt_public_transport,
      license,
      provider,
      status,
      data_source,
      updated_at,
      created_at,
      search_document_boost
    )
    SELECT
      id,
      id_legacy_ntb,
      activity_type,
      name,
      name_lower_case,
      description,
      description_plain,
      grading,
      suitable_for_children,
      distance,
      direction,
      duration_minutes,
      duration_hours,
      duration_days,
      ST_Transform(starting_point, 25833),
      ST_Transform(path, 25833),
      path_polyline,
      season,
      htgt_general,
      htgt_public_transport,
      license,
      provider,
      status,
      :data_source,
      updated_at,
      updated_at,
      100
    FROM "public"."${tableName}"
    ON CONFLICT (id_legacy_ntb) DO UPDATE
    SET
       "activity_type" = EXCLUDED."activity_type",
       "name" = EXCLUDED.name,
       "name_lower_case" = EXCLUDED.name_lower_case,
       "description" = EXCLUDED.description,
       "description_plain" = EXCLUDED.description_plain,
       "grading" = EXCLUDED.grading,
       "suitable_for_children" = EXCLUDED.suitable_for_children,
       "distance" = EXCLUDED.distance,
       "direction" = EXCLUDED.direction,
       "duration_minutes" = EXCLUDED.duration_minutes,
       "duration_hours" = EXCLUDED.duration_hours,
       "duration_days" = EXCLUDED.duration_days,
       "starting_point" = EXCLUDED.starting_point,
       "path" = EXCLUDED.path,
       "path_polyline" = EXCLUDED.path_polyline,
       "season" = EXCLUDED.season,
       "htgt_general" = EXCLUDED.htgt_general,
       "htgt_public_transport" = EXCLUDED.htgt_public_transport,
       "license" = EXCLUDED.license,
       "provider" = EXCLUDED.provider,
       "status" = EXCLUDED.status,
       "updated_at" = EXCLUDED.updated_at
  `;

  logger.info('Creating or updating trips');
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
}


/**
 * Create new trip to activity type relations
 */
async function createTripToActivityTypes(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.trips.TempTripTypeModel;

  // Set ids on trip to activity type temp data
  sql = [
    `UPDATE "public"."${tableName}" gt1 SET`,
    '  trip_id = g.id',
    `FROM "public"."${tableName}" gt2`,
    'INNER JOIN public.trips g ON',
    '  g.id_legacy_ntb = gt2.id_trip_legacy_ntb',
    'WHERE',
    '  gt1.id_trip_legacy_ntb = gt2.id_trip_legacy_ntb AND',
    '  gt1.id_trip_legacy_ntb IS NOT NULL',
  ].join('\n');

  logger.info('Update ids on trip to activity type temp data');
  durationId = startDuration();
  await knex.raw(sql);
  printDuration(durationId);

  // Create trip to activity type relations on primary activity types
  sql = [
    'INSERT INTO trips_to_activity_types (',
    '  activity_type_name, trip_id, "primary", sort_index, data_source',
    ')',
    'SELECT DISTINCT ON (activity_type, trip_id)',
    '  activity_type, trip_id, "primary", sort_index, :data_source',
    `FROM "public"."${tableName}"`,
    'WHERE trip_id IS NOT NULL',
    'ON CONFLICT (activity_type_name, trip_id) DO NOTHING',
  ].join('\n');

  logger.info(
    'Create new trip to activity type relations on primary activity types'
  );
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  printDuration(durationId);

  // Create trip to activity type relations on sub activity types
  sql = [
    'INSERT INTO trips_to_activity_types (',
    '  activity_type_name, trip_id, "primary", sort_index, data_source',
    ')',
    'SELECT DISTINCT ON (activity_sub_type, trip_id)',
    '  activity_sub_type, trip_id, "primary", sort_index, :data_source',
    `FROM "public"."${tableName}"`,
    'WHERE trip_id IS NOT NULL AND activity_sub_type IS NOT NULL',
    'ON CONFLICT (activity_type_name, trip_id) DO NOTHING',
  ].join('\n');

  logger.info(
    'Create new trip to activity type relations on sub activity types'
  );
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  printDuration(durationId);
}


/**
 * Remove trip to activity type relations that no longer exist in legacy-ntb
 */
async function removeDepreactedTripToActivityTypes(handler) {
  const { tableName } = handler.trips.TempTripTypeModel;
  const sql = [
    'DELETE FROM public.trips_to_activity_types',
    'USING public.trips_to_activity_types cf',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  (',
    '    cf.activity_type_name = te.activity_type OR',
    '    cf.activity_type_name = te.activity_sub_type',
    '  ) AND',
    '  cf.trip_id = te.trip_id',
    'WHERE',
    '  te.id_trip_legacy_ntb IS NULL AND',
    '  cf.data_source = :data_source AND',
    '  public.trips_to_activity_types.activity_type_name =',
    '    cf.activity_type_name AND',
    '  public.trips_to_activity_types.trip_id = cf.trip_id',
  ].join('\n');

  logger.info('Deleting deprecated trip to activity type relations');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  printDuration(durationId);
}

/**
 * Insert into `trip_links`-table or update if it already exists
 */
async function mergeTripLinks(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.trips.TempTripLinkModel;

  // Set ids on tripLink temp data
  sql = [
    `UPDATE "public"."${tableName}" gl1 SET`,
    '  trip_id = g.id',
    `FROM "public"."${tableName}" gl2`,
    'INNER JOIN public.trips g ON',
    '  g.id_legacy_ntb = gl2.id_trip_legacy_ntb',
    'WHERE',
    '  gl1.id_trip_legacy_ntb = gl2.id_trip_legacy_ntb AND',
    '  gl1.sort_index = gl2.sort_index',
  ].join('\n');

  logger.info('Update ids on trip links temp data');
  durationId = startDuration();
  await knex.raw(sql);
  printDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO trip_links (',
    '  id, trip_id, title, url,',
    '  sort_index, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  id, trip_id, title, url,',
    '  sort_index, :data_source, now(), now()',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (trip_id, sort_index) DO UPDATE',
    'SET',
    '  title = EXCLUDED.title,',
    '  url = EXCLUDED.url',
  ].join('\n');

  logger.info('Creating or updating trip links');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  printDuration(durationId);
}


/**
 * Remove trip links that no longer exist in legacy-ntb
 */
async function removeDepreactedTripLinks(handler) {
  const { tableName } = handler.trips.TempTripLinkModel;
  const sql = [
    'DELETE FROM public.trip_links',
    'USING public.trip_links gl',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  gl.trip_id = te.trip_id AND',
    '  gl.sort_index = te.sort_index',
    'WHERE',
    '  te.id_trip_legacy_ntb IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.trip_links.trip_id = gl.trip_id AND',
    '  public.trip_links.sort_index = gl.sort_index',
  ].join('\n');

  logger.info('Deleting deprecated trip links');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  printDuration(durationId);
}


/**
 * Create new accessabilities
 */
async function createAccessabilities(handler) {
  const { tableName } = handler.trips.TempTripAccessabilityModel;
  const sql = [
    'INSERT INTO accessabilities (name)',
    'SELECT DISTINCT name',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (name) DO NOTHING',
  ].join('\n');

  logger.info('Create new accessabilities');
  const durationId = startDuration();
  await knex.raw(sql);
  printDuration(durationId);
}


/**
 * Create new trip accessabilities
 */
async function createTripAccessabilities(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.trips.TempTripAccessabilityModel;

  // Set UUIDs on tripAccessability temp data
  sql = [
    `UPDATE "public"."${tableName}" gt1 SET`,
    '  trip_id = g.id',
    `FROM "public"."${tableName}" gt2`,
    'INNER JOIN public.trips g ON',
    '  g.id_legacy_ntb = gt2.id_trip_legacy_ntb',
    'WHERE',
    '  gt1.id_trip_legacy_ntb = gt2.id_trip_legacy_ntb',
  ].join('\n');

  logger.info('Update ids on trip accessability temp data');
  durationId = startDuration();
  await knex.raw(sql);
  printDuration(durationId);

  // Create trip accessability relations
  sql = [
    'INSERT INTO trip_accessabilities (',
    '  accessability_name, trip_id, description, data_source',
    ')',
    'SELECT',
    '  name, trip_id, description, :data_source',
    `FROM "public"."${tableName}"`,
    'ON CONFLICT (accessability_name, trip_id) DO NOTHING',
  ].join('\n');

  logger.info('Create new trip accessabilities');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  printDuration(durationId);
}


/**
 * Remove trip accessabilities that no longer exist in legacy-ntb
 */
async function removeDepreactedTripAccessabilities(handler) {
  const { tableName } = handler.trips.TempTripAccessabilityModel;
  const sql = [
    'DELETE FROM public.trip_accessabilities',
    'USING public.trip_accessabilities cf',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  cf.accessability_name = te.name AND',
    '  cf.trip_id = te.trip_id',
    'WHERE',
    '  te.id_trip_legacy_ntb IS NULL AND',
    '  cf.data_source = :data_source AND',
    '  public.trip_accessabilities.accessability_name =',
    '    cf.accessability_name',
    '  AND public.trip_accessabilities.trip_id = cf.trip_id',
  ].join('\n');

  logger.info('Deleting deprecated trip accessabilities');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  printDuration(durationId);
}


/**
 * Insert into `trips_to_groups`-table or update if it already exists
 */
async function mergeTripToGroup(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.trips.TempTripToGroupModel;

  // Set ids on tripToGroup temp data
  sql = [
    `UPDATE "public"."${tableName}" a1 SET`,
    '  trip_id = c.id,',
    '  group_id = a.id',
    `FROM "public"."${tableName}" a2`,
    'INNER JOIN public.groups a ON',
    '  a.id_legacy_ntb = a2.group_legacy_id',
    'INNER JOIN public.trips c ON',
    '  c.id_legacy_ntb = a2.trip_legacy_id',
    'WHERE',
    '  a1.group_legacy_id = a2.group_legacy_id AND',
    '  a1.trip_legacy_id = a2.trip_legacy_id',
  ].join('\n');

  logger.info('Update ids on trip-to-group temp data');
  durationId = startDuration();
  await knex.raw(sql);
  printDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO trips_to_groups (',
    '  trip_id, group_id, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  trip_id, group_id, :data_source, now(), now()',
    `FROM "public"."${tableName}"`,
    'WHERE trip_id IS NOT NULL AND group_id IS NOT NULL',
    'ON CONFLICT (trip_id, group_id) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating trip to group relations');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  printDuration(durationId);
}


/**
 * Remove trip to group relations that no longer exist in legacy-ntb
 */
async function removeDepreactedTripToGroup(handler) {
  const { tableName } = handler.trips.TempTripToGroupModel;

  const sql = [
    'DELETE FROM public.trips_to_groups',
    'USING public.trips_to_groups c2a',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  c2a.trip_id = te.trip_id AND',
    '  c2a.group_id = te.group_id',
    'WHERE',
    '  te.group_id IS NULL AND',
    '  c2a.data_source = :data_source AND',
    '  public.trips_to_groups.trip_id = c2a.trip_id AND',
    '  public.trips_to_groups.group_id = c2a.group_id',
  ].join('\n');

  logger.info('Deleting deprecated trip to group relations');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  printDuration(durationId);
}


/**
 * Insert into `trips_to_pois`-table or update if it already exists
 */
async function mergeTripToPoi(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.trips.TempTripToPoiModel;

  // Set ids on tripToPoi temp data
  sql = [
    `UPDATE "public"."${tableName}" a1 SET`,
    '  trip_id = c.id,',
    '  poi_id = a.id',
    `FROM "public"."${tableName}" a2`,
    'INNER JOIN public.pois a ON',
    '  a.id_legacy_ntb = a2.poi_legacy_id',
    'INNER JOIN public.trips c ON',
    '  c.id_legacy_ntb = a2.trip_legacy_id',
    'WHERE',
    '  a1.poi_legacy_id = a2.poi_legacy_id AND',
    '  a1.trip_legacy_id = a2.trip_legacy_id',
  ].join('\n');

  logger.info('Update ids on trip-to-poi temp data');
  durationId = startDuration();
  await knex.raw(sql);
  printDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO trips_to_pois (',
    '  trip_id, poi_id, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  trip_id, poi_id, :data_source, now(), now()',
    `FROM "public"."${tableName}"`,
    'WHERE trip_id IS NOT NULL AND poi_id IS NOT NULL',
    'ON CONFLICT (trip_id, poi_id) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating trip to poi relations');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  printDuration(durationId);
}


/**
 * Remove trip to poi relations that no longer exist in legacy-ntb
 */
async function removeDepreactedTripToPoi(handler) {
  const { tableName } = handler.trips.TempTripToPoiModel;

  const sql = [
    'DELETE FROM public.trips_to_pois',
    'USING public.trips_to_pois c2a',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  c2a.trip_id = te.trip_id AND',
    '  c2a.poi_id = te.poi_id',
    'WHERE',
    '  te.poi_id IS NULL AND',
    '  c2a.data_source = :data_source AND',
    '  public.trips_to_pois.trip_id = c2a.trip_id AND',
    '  public.trips_to_pois.poi_id = c2a.poi_id',
  ].join('\n');

  logger.info('Deleting deprecated trip to poi relations');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  printDuration(durationId);
}


/**
 * Insert trip id into `pictures`-table
 */
async function setTripPictures(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.trips.TempTripPicturesModel;

  // Set ids on tripToTrip temp data
  sql = [
    `UPDATE "public"."${tableName}" a1 SET`,
    '  trip_id = a.id',
    `FROM "public"."${tableName}" a2`,
    'INNER JOIN public.trips a ON',
    '  a.id_legacy_ntb = a2.trip_legacy_id',
    'WHERE',
    '  a1.trip_legacy_id = a2.trip_legacy_id AND',
    '  a1.picture_legacy_id = a2.picture_legacy_id',
  ].join('\n');

  logger.info('Update ids on trip-to-picture temp data');
  durationId = startDuration();
  await knex.raw(sql);
  printDuration(durationId);

  // Merge into prod table
  sql = [
    'UPDATE pictures p1 SET',
    '  trip_id = a.trip_id,',
    '  sort_index = a.sort_index',
    'FROM pictures p2',
    `INNER JOIN "public"."${tableName}" a ON`,
    '  a.picture_legacy_id = p2.id_legacy_ntb',
    'WHERE',
    '  p1.id = p2.id',
  ].join('\n');

  logger.info('Setting trip id on pictures');
  durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  printDuration(durationId);
}


/**
 * Remove pictures that used to belong to an trip in legacy-ntb
 */
async function removeDepreactedTripPictures(handler) {
  const { tableName } = handler.trips.TempTripPicturesModel;
  const sql = [
    'DELETE FROM public.pictures',
    'USING public.pictures p2',
    `LEFT JOIN "public"."${tableName}" te ON`,
    '  p2.id_legacy_ntb = te.picture_legacy_id',
    'WHERE',
    '  te.picture_legacy_id IS NULL AND',
    '  p2.trip_id IS NOT NULL AND',
    '  p2.data_source = :data_source AND',
    '  public.pictures.id = p2.id',
  ].join('\n');

  logger.info('Deleting deprecated trip pictures');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
  });
  printDuration(durationId);
}


/**
 * Mark trips that no longer exist in legacy-ntb as deleted
 */
async function removeDepreactedTrip(handler) {
  const { tableName } = handler.trips.TempTripModel;
  const sql = [
    'UPDATE public.trips a1 SET',
    '  status = :status',
    'FROM public.trips a2',
    `LEFT JOIN "public"."${tableName}" t ON`,
    '  t.id_legacy_ntb = a2.id_legacy_ntb',
    'WHERE',
    '  t.id_legacy_ntb IS NULL AND',
    '  a1.id = a2.id AND',
    '  a2.data_source = :data_source AND',
    '  a2.status != :status',
  ].join('\n');

  logger.info('Marking deprecated trips as deleted');
  const durationId = startDuration();
  await knex.raw(sql, {
    data_source: DATASOURCE_NAME,
    status: 'deleted',
  });
  printDuration(durationId);
}


/**
 * Process legacy trip data and merge it into the postgres database
 */
const process = async (handler, fullHarvest = false) => {
  logger.info('Processing trips');
  handler.trips = {};

  await createTempTables(handler, false);
  await mergeActivityType(handler);
  await mergeTrip(handler);
  await createTripToActivityTypes(handler);
  if (fullHarvest) await removeDepreactedTripToActivityTypes(handler);
  await mergeTripLinks(handler);
  if (fullHarvest) await removeDepreactedTripLinks(handler);
  await mergeTripToGroup(handler);
  if (fullHarvest) await removeDepreactedTripToGroup(handler);
  await mergeTripToPoi(handler);
  if (fullHarvest) await removeDepreactedTripToPoi(handler);
  await createAccessabilities(handler);
  await createTripAccessabilities(handler);
  if (fullHarvest) await removeDepreactedTripAccessabilities(handler);
  await setTripPictures(handler);
  if (fullHarvest) await removeDepreactedTripPictures(handler);
  if (fullHarvest) await removeDepreactedTrip(handler);
  await dropTempTables(handler);
};


/**
 * Map trip data
 */
export const mapTripData = async (handler, first = false) => {
  logger.info('Mapping trips');
  handler.trips = {};

  await mapData(handler);
  await createTempTables(handler, first);
  await populateTempTables(handler);
};


export default process;

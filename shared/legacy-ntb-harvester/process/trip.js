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

  let tableName = `${baseTableName}_trip`;
  handler.trips.TempTripModel = db.sequelize.define(tableName, {
    uuid: { type: db.Sequelize.UUID, primaryKey: true },
    idLegacyNtb: { type: db.Sequelize.TEXT },
    activityType: { type: db.Sequelize.TEXT },
    name: { type: db.Sequelize.TEXT },
    nameLowerCase: { type: db.Sequelize.TEXT },
    description: { type: db.Sequelize.TEXT },
    descriptionPlain: { type: db.Sequelize.TEXT },
    url: { type: db.Sequelize.TEXT },

    grading: { type: db.Sequelize.TEXT },
    suitableForChildren: { type: db.Sequelize.BOOLEAN },
    distance: { type: db.Sequelize.INTEGER },
    direction: { type: db.Sequelize.TEXT },

    durationMinutes: { type: db.Sequelize.INTEGER },
    durationHours: { type: db.Sequelize.INTEGER },
    durationDays: { type: db.Sequelize.INTEGER },

    startingPoint: { type: db.Sequelize.GEOMETRY },
    geojson: { type: db.Sequelize.GEOMETRY },
    polyline: { type: db.Sequelize.TEXT },

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
  if (sync) await handler.trips.TempTripModel.sync();

  tableName = `${baseTableName}_trip_types`;
  handler.trips.TempTripTypeModel =
    db.sequelize.define(tableName, {
      activityType: { type: db.Sequelize.TEXT },
      activitySubType: { type: db.Sequelize.TEXT },
      tripUuid: { type: db.Sequelize.UUID },
      idTripLegacyNtb: { type: db.Sequelize.TEXT },
      primary: { type: db.Sequelize.BOOLEAN },
      sortIndex: { type: db.Sequelize.INTEGER },
      dataSource: { type: db.Sequelize.TEXT },
      updatedAt: { type: db.Sequelize.DATE },
    }, {
      timestamps: false,
      tableName,
    });
  if (sync) await handler.trips.TempTripTypeModel.sync();

  tableName = `${baseTableName}_trip_links`;
  handler.trips.TempTripLinkModel =
    db.sequelize.define(tableName, {
      uuid: { type: db.Sequelize.UUID, primaryKey: true },
      title: { type: db.Sequelize.TEXT, allowNull: true },
      url: { type: db.Sequelize.TEXT },
      tripUuid: { type: db.Sequelize.UUID, allowNull: true },
      idTripLegacyNtb: { type: db.Sequelize.TEXT },
      sortIndex: { type: db.Sequelize.INTEGER },
      dataSource: { type: db.Sequelize.TEXT },
      updatedAt: { type: db.Sequelize.DATE },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.trips.TempTripLinkModel.sync();

  tableName = `${baseTableName}_trip_to_group`;
  handler.trips.TempTripToGroupModel =
    db.sequelize.define(tableName, {
      tripUuid: { type: db.Sequelize.UUID },
      groupUuid: { type: db.Sequelize.UUID },
      tripLegacyId: { type: db.Sequelize.TEXT },
      groupLegacyId: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.trips.TempTripToGroupModel.sync();

  tableName = `${baseTableName}_trip_to_poi`;
  handler.trips.TempTripToPoiModel =
    db.sequelize.define(tableName, {
      tripUuid: { type: db.Sequelize.UUID },
      poiUuid: { type: db.Sequelize.UUID },
      tripLegacyId: { type: db.Sequelize.TEXT },
      poiLegacyId: { type: db.Sequelize.TEXT },
    }, {
      timestamps: false,
      tableName,
    });
  await handler.trips.TempTripToPoiModel.sync();


  endDuration(durationId);
}


/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  await handler.trips.TempTripModel.drop();
  await handler.trips.TempTripTypeModel.drop();
  await handler.trips.TempTripLinkModel.drop();
  await handler.trips.TempTripToGroupModel.drop();
  await handler.trips.TempTripToPoiModel.drop();

  endDuration(durationId);
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
  endDuration(durationId);

  handler.trips.processed = trips;
}


/**
 * Populate temporary tables with the processed legacy ntb data
 */
async function populateTempTables(handler) {
  let durationId;

  logger.info('Inserting trips to temporary table');
  durationId = startDuration();
  const trips = handler.trips.processed.map((p) => p.trip);
  await handler.trips.TempTripModel.bulkCreate(trips);
  endDuration(durationId);

  const tripToGroup = [];
  const tripToPoi = [];
  let links = [];
  let activitySubTypes = [];
  handler.trips.processed.forEach((p) => {
    activitySubTypes = activitySubTypes.concat(p.activitySubTypes);
    links = links.concat(p.links);

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
  });

  // Insert temp data for trip activity types
  logger.info('Inserting trip activity types to temporary table');
  durationId = startDuration();
  await handler.trips.TempTripTypeModel.bulkCreate(activitySubTypes);
  endDuration(durationId);

  // Insert temp data for TripLink
  logger.info('Inserting trip links to temporary table');
  durationId = startDuration();
  await handler.trips.TempTripLinkModel.bulkCreate(links);
  endDuration(durationId);

  // Insert temp data for TripToGroup
  logger.info('Inserting trip to group temporary table');
  durationId = startDuration();
  await handler.trips.TempTripToGroupModel.bulkCreate(tripToGroup);
  endDuration(durationId);

  // Insert temp data for TripToPoi
  logger.info('Inserting trip to poi temporary table');
  durationId = startDuration();
  await handler.trips.TempTripToPoiModel.bulkCreate(tripToPoi);
  endDuration(durationId);
}


/**
 * Insert into `activity_type`-table
 */

async function mergeActivityType(handler) {
  let { tableName } = handler.trips.TempTripModel;

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
  ({ tableName } = handler.trips.TempTripTypeModel);
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
 * Insert into `trip`-table or update if it already exists
 */
async function mergeTrip(handler) {
  const { tableName } = handler.trips.TempTripModel;

  // Merge into prod table
  const sql = [
    'INSERT INTO trip (',
    '  uuid,',
    '  id_legacy_ntb,',
    '  activity_type,',
    '  name,',
    '  name_lower_case,',
    '  description,',
    '  description_plain,',
    '  grading,',
    '  suitable_for_children,',
    '  distance,',
    '  direction,',
    '  duration_minutes,',
    '  duration_hours,',
    '  duration_days,',
    '  starting_point,',
    '  geojson,',
    '  polyline,',
    '  season,',
    '  htgt_general,',
    '  htgt_public_transport,',
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
    '  activity_type,',
    '  name,',
    '  name_lower_case,',
    '  description,',
    '  description_plain,',
    '  grading::enum_trip_grading,',
    '  suitable_for_children,',
    '  distance,',
    '  direction::enum_trip_direction,',
    '  duration_minutes,',
    '  duration_hours,',
    '  duration_days,',
    '  starting_point,',
    '  geojson,',
    '  polyline,',
    '  season,',
    '  htgt_general,',
    '  htgt_public_transport,',
    '  license,',
    '  provider,',
    '  status::enum_trip_status,',
    '  :data_source,',
    '  updated_at,',
    '  updated_at,',
    '  1',
    `FROM public.${tableName}`,
    'ON CONFLICT (id_legacy_ntb) DO UPDATE',
    'SET',
    '   "activity_type" = EXCLUDED."activity_type",',
    '   "name" = EXCLUDED.name,',
    '   "name_lower_case" = EXCLUDED.name_lower_case,',
    '   "description" = EXCLUDED.description,',
    '   "description_plain" = EXCLUDED.description_plain,',
    '   "grading" = EXCLUDED.grading,',
    '   "suitable_for_children" = EXCLUDED.suitable_for_children,',
    '   "distance" = EXCLUDED.distance,',
    '   "direction" = EXCLUDED.direction,',
    '   "duration_minutes" = EXCLUDED.duration_minutes,',
    '   "duration_hours" = EXCLUDED.duration_hours,',
    '   "duration_days" = EXCLUDED.duration_days,',
    '   "starting_point" = EXCLUDED.starting_point,',
    '   "geojson" = EXCLUDED.geojson,',
    '   "polyline" = EXCLUDED.polyline,',
    '   "season" = EXCLUDED.season,',
    '   "htgt_general" = EXCLUDED.htgt_general,',
    '   "htgt_public_transport" = EXCLUDED.htgt_public_transport,',
    '   "license" = EXCLUDED.license,',
    '   "provider" = EXCLUDED.provider,',
    '   "status" = EXCLUDED.status,',
    '   "updated_at" = EXCLUDED.updated_at',
  ].join('\n');

  logger.info('Creating or updating trips');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Create new trip to activity type relations
 */
async function createTripToActivityTypes(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.trips.TempTripTypeModel;

  // Set UUIDs on trip to activity type temp data
  sql = [
    `UPDATE public.${tableName} gt1 SET`,
    '  trip_uuid = g.uuid',
    `FROM public.${tableName} gt2`,
    'INNER JOIN public.trip g ON',
    '  g.id_legacy_ntb = gt2.id_trip_legacy_ntb',
    'WHERE',
    '  gt1.id_trip_legacy_ntb = gt2.id_trip_legacy_ntb AND',
    '  gt1.id_trip_legacy_ntb IS NOT NULL',
  ].join('\n');

  logger.info('Update uuids on trip to activity type temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Create trip to activity type relations on primary activity types
  sql = [
    'INSERT INTO trip_to_activity_type (',
    '  activity_type_name, trip_uuid, "primary", sort_index, data_source',
    ')',
    'SELECT DISTINCT ON (activity_type, trip_uuid)',
    '  activity_type, trip_uuid, "primary", sort_index, :data_source',
    `FROM public.${tableName}`,
    'WHERE trip_uuid IS NOT NULL',
    'ON CONFLICT (activity_type_name, trip_uuid) DO NOTHING',
  ].join('\n');

  logger.info(
    'Create new trip to activity type relations on primary activity types'
  );
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);

  // Create trip to activity type relations on sub activity types
  sql = [
    'INSERT INTO trip_to_activity_type (',
    '  activity_type_name, trip_uuid, "primary", sort_index, data_source',
    ')',
    'SELECT DISTINCT ON (activity_sub_type, trip_uuid)',
    '  activity_sub_type, trip_uuid, "primary", sort_index, :data_source',
    `FROM public.${tableName}`,
    'WHERE trip_uuid IS NOT NULL AND activity_sub_type IS NOT NULL',
    'ON CONFLICT (activity_type_name, trip_uuid) DO NOTHING',
  ].join('\n');

  logger.info(
    'Create new trip to activity type relations on sub activity types'
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
 * Remove trip to activity type relations that no longer exist in legacy-ntb
 */
async function removeDepreactedTripToActivityTypes(handler) {
  const { tableName } = handler.trips.TempTripTypeModel;
  const sql = [
    'DELETE FROM public.trip_to_activity_type',
    'USING public.trip_to_activity_type cf',
    `LEFT JOIN public.${tableName} te ON`,
    '  (',
    '    cf.activity_type_name = te.activity_type OR',
    '    cf.activity_type_name = te.activity_sub_type',
    '  ) AND',
    '  cf.trip_uuid = te.trip_uuid',
    'WHERE',
    '  te.id_trip_legacy_ntb IS NULL AND',
    '  cf.data_source = :data_source AND',
    '  public.trip_to_activity_type.activity_type_name =',
    '    cf.activity_type_name AND',
    '  public.trip_to_activity_type.trip_uuid = cf.trip_uuid',
  ].join('\n');

  logger.info('Deleting deprecated trip to activity type relations');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}

/**
 * Insert into `trip_link`-table or update if it already exists
 */
async function mergeTripLinks(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.trips.TempTripLinkModel;

  // Set UUIDs on tripLink temp data
  sql = [
    `UPDATE public.${tableName} gl1 SET`,
    '  trip_uuid = g.uuid',
    `FROM public.${tableName} gl2`,
    'INNER JOIN public.trip g ON',
    '  g.id_legacy_ntb = gl2.id_trip_legacy_ntb',
    'WHERE',
    '  gl1.id_trip_legacy_ntb = gl2.id_trip_legacy_ntb AND',
    '  gl1.sort_index = gl2.sort_index',
  ].join('\n');

  logger.info('Update uuids on trip links temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO trip_link (',
    '  uuid, trip_uuid, title, url,',
    '  sort_index, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  uuid, trip_uuid, title, url,',
    '  sort_index, :data_source, now(), now()',
    `FROM public.${tableName}`,
    'ON CONFLICT (trip_uuid, sort_index) DO UPDATE',
    'SET',
    '  title = EXCLUDED.title,',
    '  url = EXCLUDED.url',
  ].join('\n');

  logger.info('Creating or updating trip links');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove trip links that no longer exist in legacy-ntb
 */
async function removeDepreactedTripLinks(handler) {
  const { tableName } = handler.trips.TempTripLinkModel;
  const sql = [
    'DELETE FROM public.trip_link',
    'USING public.trip_link gl',
    `LEFT JOIN public.${tableName} te ON`,
    '  gl.trip_uuid = te.trip_uuid AND',
    '  gl.sort_index = te.sort_index',
    'WHERE',
    '  te.id_trip_legacy_ntb IS NULL AND',
    '  gl.data_source = :data_source AND',
    '  public.trip_link.trip_uuid = gl.trip_uuid AND',
    '  public.trip_link.sort_index = gl.sort_index',
  ].join('\n');

  logger.info('Deleting deprecated trip links');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Insert into `trip_to_group`-table or update if it already exists
 */
async function mergeTripToGroup(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.trips.TempTripToGroupModel;

  // Set UUIDs on tripToGroup temp data
  sql = [
    `UPDATE public.${tableName} a1 SET`,
    '  trip_uuid = c.uuid,',
    '  group_uuid = a.uuid',
    `FROM public.${tableName} a2`,
    'INNER JOIN public.group a ON',
    '  a.id_legacy_ntb = a2.group_legacy_id',
    'INNER JOIN public.trip c ON',
    '  c.id_legacy_ntb = a2.trip_legacy_id',
    'WHERE',
    '  a1.group_legacy_id = a2.group_legacy_id AND',
    '  a1.trip_legacy_id = a2.trip_legacy_id',
  ].join('\n');

  logger.info('Update uuids on trip-to-group temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO trip_to_group (',
    '  trip_uuid, group_uuid, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  trip_uuid, group_uuid, :data_source, now(), now()',
    `FROM public.${tableName}`,
    'WHERE trip_uuid IS NOT NULL AND group_uuid IS NOT NULL',
    'ON CONFLICT (trip_uuid, group_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating trip to group relations');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove trip to group relations that no longer exist in legacy-ntb
 */
async function removeDepreactedTripToGroup(handler) {
  const { tableName } = handler.trips.TempTripToGroupModel;

  const sql = [
    'DELETE FROM public.trip_to_group',
    'USING public.trip_to_group c2a',
    `LEFT JOIN public.${tableName} te ON`,
    '  c2a.trip_uuid = te.trip_uuid AND',
    '  c2a.group_uuid = te.group_uuid',
    'WHERE',
    '  te.group_uuid IS NULL AND',
    '  c2a.data_source = :data_source AND',
    '  public.trip_to_group.trip_uuid = c2a.trip_uuid AND',
    '  public.trip_to_group.group_uuid = c2a.group_uuid',
  ].join('\n');

  logger.info('Deleting deprecated trip to group relations');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Insert into `trip_to_poi`-table or update if it already exists
 */
async function mergeTripToPoi(handler) {
  let sql;
  let durationId;
  const { tableName } = handler.trips.TempTripToPoiModel;

  // Set UUIDs on tripToPoi temp data
  sql = [
    `UPDATE public.${tableName} a1 SET`,
    '  trip_uuid = c.uuid,',
    '  poi_uuid = a.uuid',
    `FROM public.${tableName} a2`,
    'INNER JOIN public.poi a ON',
    '  a.id_legacy_ntb = a2.poi_legacy_id',
    'INNER JOIN public.trip c ON',
    '  c.id_legacy_ntb = a2.trip_legacy_id',
    'WHERE',
    '  a1.poi_legacy_id = a2.poi_legacy_id AND',
    '  a1.trip_legacy_id = a2.trip_legacy_id',
  ].join('\n');

  logger.info('Update uuids on trip-to-poi temp data');
  durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);

  // Merge into prod table
  sql = [
    'INSERT INTO trip_to_poi (',
    '  trip_uuid, poi_uuid, data_source, created_at, updated_at',
    ')',
    'SELECT',
    '  trip_uuid, poi_uuid, :data_source, now(), now()',
    `FROM public.${tableName}`,
    'WHERE trip_uuid IS NOT NULL AND poi_uuid IS NOT NULL',
    'ON CONFLICT (trip_uuid, poi_uuid) DO NOTHING',
  ].join('\n');

  logger.info('Creating or updating trip to poi relations');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Remove trip to poi relations that no longer exist in legacy-ntb
 */
async function removeDepreactedTripToPoi(handler) {
  const { tableName } = handler.trips.TempTripToPoiModel;

  const sql = [
    'DELETE FROM public.trip_to_poi',
    'USING public.trip_to_poi c2a',
    `LEFT JOIN public.${tableName} te ON`,
    '  c2a.trip_uuid = te.trip_uuid AND',
    '  c2a.poi_uuid = te.poi_uuid',
    'WHERE',
    '  te.poi_uuid IS NULL AND',
    '  c2a.data_source = :data_source AND',
    '  public.trip_to_poi.trip_uuid = c2a.trip_uuid AND',
    '  public.trip_to_poi.poi_uuid = c2a.poi_uuid',
  ].join('\n');

  logger.info('Deleting deprecated trip to poi relations');
  const durationId = startDuration();
  await db.sequelize.query(sql, {
    replacements: {
      data_source: DATASOURCE_NAME,
    },
  });
  endDuration(durationId);
}


/**
 * Mark trips that no longer exist in legacy-ntb as deleted
 */
async function removeDepreactedTrip(handler) {
  const { tableName } = handler.trips.TempTripModel;
  const sql = [
    'UPDATE public.trip a1 SET',
    '  status = :status',
    'FROM public.trip a2',
    `LEFT JOIN public.${tableName} t ON`,
    '  t.id_legacy_ntb = a2.id_legacy_ntb',
    'WHERE',
    '  t.id_legacy_ntb IS NULL AND',
    '  a1.uuid = a2.uuid AND',
    '  a2.data_source = :data_source AND',
    '  a2.status != :status',
  ].join('\n');

  logger.info('Marking deprecated trips as deleted');
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
 * Process legacy trip data and merge it into the postgres database
 */
const process = async (handler, first = false) => {
  logger.info('Processing trips');
  handler.trips = {};

  await createTempTables(handler, false);
  await mergeActivityType(handler);
  await mergeTrip(handler);
  await createTripToActivityTypes(handler);
  await removeDepreactedTripToActivityTypes(handler);
  await mergeTripLinks(handler);
  await removeDepreactedTripLinks(handler);
  await mergeTripToGroup(handler);
  await removeDepreactedTripToGroup(handler);
  await mergeTripToPoi(handler);
  await removeDepreactedTripToPoi(handler);
  await removeDepreactedTrip(handler);
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

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

  let activitySubTypes = [];
  handler.trips.processed.forEach((p) => {
    activitySubTypes = activitySubTypes.concat(p.activitySubTypes);
  });

  // Insert temp data for trip activity types
  logger.info('Inserting trip activity types to temporary table');
  durationId = startDuration();
  await handler.trips.TempTripTypeModel.bulkCreate(activitySubTypes);
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
    '  uuid, id_legacy_ntb, activity_type, name, name_lower_case,',
    '  description, description_plain, grading, distance, direction,',
    '  duration_minutes, duration_hours, duration_days, starting_point,',
    '  geojson, polyline, season, htgt_general, htgt_public_transport,',
    '  license, provider, status, data_source, updated_at, created_at,',
    '  search_document_boost',
    ')',
    'SELECT',
    '  uuid, id_legacy_ntb, activity_type, name, name_lower_case,',
    '  description, description_plain, grading::enum_trip_grading,',
    '  distance, direction::enum_trip_direction, duration_minutes,',
    '  duration_hours, duration_days, starting_point, geojson, polyline,',
    '  season, htgt_general, htgt_public_transport, license, provider,',
    '  status::enum_trip_status, :data_source, updated_at, updated_at, 1',
    `FROM public.${tableName}`,
    'WHERE route_code IS NULL',
    'ON CONFLICT (id_legacy_ntb) DO UPDATE',
    'SET',
    '   "activity_type" = EXCLUDED."activity_type",',
    '   "name" = EXCLUDED.name,',
    '   "name_lower_case" = EXCLUDED.name_lower_case,',
    '   "description" = EXCLUDED.description,',
    '   "description_plain" = EXCLUDED.description_plain,',
    '   "grading" = EXCLUDED.grading,',
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
 * Process legacy trip/route data and merge it into the postgres database
 */
const process = async (handler, first = false) => {
  logger.info('Processing trips');
  handler.trips = {};

  await createTempTables(handler, false);
  await mergeActivityType(handler);
  await mergeTrip(handler);
  // await dropTempTables(handler);
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

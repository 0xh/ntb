import db from '@turistforeningen/ntb-shared-models';
import { createLogger, startDuration, endDuration } from
  '@turistforeningen/ntb-shared-utils';

import * as legacy from '../legacy-structure/';


const logger = createLogger();


/**
 * Create temporary tables that will hold the processed data harvested from
 * legacy-ntb
 */
async function createTempTables(handler, sync = false) {
  logger.info('Creating temporary tables');
  const durationId = startDuration();

  const baseTableName = `_temp_legacy_ntb_harvest_${handler.timeStamp}`;

  const tableName = `${baseTableName}_picture`;
  handler.pictures.TempPictureModel = db.sequelize.define(tableName, {
    uuid: { type: db.Sequelize.UUID, primaryKey: true },
    idLegacyNtb: { type: db.Sequelize.TEXT },
    areaUuid: { type: db.Sequelize.UUID },
    cabinUuid: { type: db.Sequelize.UUID },
    listUuid: { type: db.Sequelize.UUID },
    poiUuid: { type: db.Sequelize.UUID },
    routeUuid: { type: db.Sequelize.UUID },
    tripUuid: { type: db.Sequelize.UUID },

    photographerName: { type: db.Sequelize.TEXT },
    photographerEmail: { type: db.Sequelize.TEXT },
    photographerCredit: { type: db.Sequelize.TEXT },
    description: { type: db.Sequelize.TEXT },

    coordinates: { type: db.Sequelize.GEOMETRY },

    original: { type: db.Sequelize.JSONB },
    exif: { type: db.Sequelize.JSONB },
    versions: { type: db.Sequelize.JSONB },

    legacyFirstTag: { type: db.Sequelize.TEXT },
    legacyTags: { type: db.Sequelize.ARRAY(db.Sequelize.TEXT) },

    license: { type: db.Sequelize.TEXT },
    provider: { type: db.Sequelize.TEXT },
    status: { type: db.Sequelize.TEXT },
    dataSource: { type: db.Sequelize.TEXT },
    updatedAt: { type: db.Sequelize.DATE },
  }, {
    timestamps: false,
    tableName,
  });
  if (sync) await handler.pictures.TempPictureModel.sync();

  endDuration(durationId);
}


/**
 * Drop the temporary tables
 */
async function dropTempTables(handler) {
  logger.info('Dropping temporary tables');
  const durationId = startDuration();

  await handler.pictures.TempPictureModel.drop();

  endDuration(durationId);
}


/**
 * Send legacy ntb data through a mapper that converts old structure to new
 */
async function mapData(handler) {
  logger.info('Mapping legacy data to new structure');
  const durationId = startDuration();
  const pictures = [];

  await Promise.all(
    handler.documents.bilder
      .map(async (d) => {
        const m = await legacy.bilder.mapping(d, handler);
        pictures.push(m);
      })
  );
  endDuration(durationId);

  handler.pictures.processed = pictures;
}


/**
 * Populate temporary tables with the processed legacy ntb data
 */
async function populateTempTables(handler) {
  logger.info('Inserting pictures to temporary table');
  const durationId = startDuration();
  const pictures = handler.pictures.processed.map((p) => p.picture);
  await handler.pictures.TempPictureModel.bulkCreate(pictures);
  endDuration(durationId);
}


/**
 * Insert into `picture`-table or update if it already exists
 */
async function mergePictures(handler) {
  const { tableName } = handler.pictures.TempPictureModel;

  const sql = [
    'INSERT INTO public.picture (',
    '  uuid,',
    '  id_legacy_ntb,',
    '  photographer_name,',
    '  photographer_email,',
    '  photographer_credit,',
    '  description,',
    '  coordinates,',
    '  original,',
    '  exif,',
    '  versions,',
    '  legacy_first_tag,',
    '  legacy_tags,',
    '  license,',
    '  provider,',
    '  status,',
    '  data_source,',
    '  created_at,',
    '  updated_at',
    ')',
    'SELECT',
    '  uuid,',
    '  id_legacy_ntb,',
    '  photographer_name,',
    '  photographer_email,',
    '  photographer_credit,',
    '  description,',
    '  coordinates,',
    '  original,',
    '  exif,',
    '  versions,',
    '  legacy_first_tag,',
    '  legacy_tags,',
    '  license,',
    '  provider,',
    '  status,',
    '  data_source,',
    '  updated_at,',
    '  updated_at',
    `FROM public.${tableName}`,
    'ON CONFLICT (id_legacy_ntb) DO UPDATE',
    'SET',
    '  photographer_name = EXCLUDED.photographer_name,',
    '  photographer_email = EXCLUDED.photographer_email,',
    '  photographer_credit = EXCLUDED.photographer_credit,',
    '  description = EXCLUDED.description,',
    '  coordinates = EXCLUDED.coordinates,',
    '  original = EXCLUDED.original,',
    '  exif = EXCLUDED.exif,',
    '  versions = EXCLUDED.versions,',
    '  legacy_first_tag = EXCLUDED.legacy_first_tag,',
    '  legacy_tags = EXCLUDED.legacy_tags,',
    '  license = EXCLUDED.license,',
    '  provider = EXCLUDED.provider,',
    '  status = EXCLUDED.status,',
    '  data_source = EXCLUDED.data_source,',
    '  updated_at = EXCLUDED.updated_at',
  ].join('\n');

  logger.info('Creating or updating pictures');
  const durationId = startDuration();
  await db.sequelize.query(sql);
  endDuration(durationId);
}


/**
 * Process legacy picture data and merge it into the postgres database
 */
const process = async (handler, first = false) => {
  logger.info('Processing pictures');
  handler.pictures = {};

  await createTempTables(handler, false);
  await mergePictures(handler);
  await dropTempTables(handler);
};


/**
 * Map picture data
 */
export const mapPictureData = async (handler, first = false) => {
  logger.info('Mapping pictures');
  handler.pictures = {};

  await mapData(handler);
  await createTempTables(handler, first);
  await populateTempTables(handler);
};


export default process;

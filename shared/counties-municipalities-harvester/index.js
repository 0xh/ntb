import fetch from 'isomorphic-fetch';
import moment from 'moment';
import uuid4 from 'uuid/v4';

import {
  logError,
  createLogger,
  startDuration,
  endDuration,
} from '@turistforeningen/ntb-shared-utils';
import db from '@turistforeningen/ntb-shared-models';


const logger = createLogger();


// ######################################
// Configuration
// ######################################


const DATASOURCE_NAME = 'kartverket';

const COUNTIES_API_URL = (
  'https://register.geonorge.no/subregister/sosi-kodelister/' +
  'kartverket/fylkesnummer-alle'
);

const MUNICIPALITIES_API_URL = (
  'https://register.geonorge.no/subregister/sosi-kodelister/' +
  'kartverket/kommunenummer-alle'
);


// ######################################
// Predicate functions
// ######################################

/**
 * Makes sure the value is a string
 */
function isString(value) {
  return typeof value === 'string' || value instanceof String;
}


/**
 * Makes sure the API item status is valid
 */
function isValidStatus(status) {
  return (
    status === 'Gyldig' ||
    status === 'Utgått' ||
    status === 'Innsendt'
  );
}


// ######################################
// Helpers
// ######################################


/**
 * Translate Kartverket-API status to the correct status name for NTB
 */
function translateStatus(status) {
  switch (status.toLowerCase()) {
    case 'utgått':
      return 'deleted';
    case 'gyldig':
      return 'public';
    default:
      return 'draft';
  }
}


// ######################################
// Temp db tables
// ######################################


/**
 * Create temporary table for holding info on new/updated counties or
 * municipalities
 */
async function createTempTableCM(tableName, municipality = false) {
  const fields = {
    uuid: {
      type: db.Sequelize.UUID,
      primaryKey: true,
    },
    county_uuid: db.Sequelize.UUID,
    code: db.Sequelize.TEXT,
    name: db.Sequelize.TEXT,
    name_lower_case: db.Sequelize.TEXT,
    status: db.Sequelize.TEXT,
    data_source: db.Sequelize.TEXT,
  };

  if (municipality) {
    fields.county_uuid = db.Sequelize.UUID;
  }

  const model = db.sequelize.define(tableName, fields, {
    timestamps: false,
    tableName,
  });

  await model.sync();
  return model;
}

/**
 * Create temporary table for holding info on new/updated translations for
 * counties or municipalities
 */
async function createTempTableCMTranslation(tableName) {
  const model = db.sequelize.define(tableName, {
    uuid: {
      type: db.Sequelize.UUID,
      primaryKey: true,
    },
    m_uuid: db.Sequelize.UUID,
    name: db.Sequelize.TEXT,
    name_lower_case: db.Sequelize.TEXT,
    language: db.Sequelize.TEXT,
    data_source: db.Sequelize.TEXT,
  }, {
    timestamps: false,
    tableName,
  });

  await model.sync();
  return model;
}

/**
 * Create temporary tables
 */
async function createTempTables() {
  const date = moment().format('YYYYMMDDHHmmssSSS');
  const baseTableName = `_temp_cm_harvest_${date}`;
  const c = `${baseTableName}_c`;
  const ct = `${baseTableName}_ct`;
  const m = `${baseTableName}_m`;
  const mt = `${baseTableName}_mt`;

  logger.info('Creating temporary database tables');
  const durationId = startDuration();

  const County = await createTempTableCM(c);
  const CountyTranslation = await createTempTableCMTranslation(ct);
  const Municipality = await createTempTableCM(m, true);
  const MunicipalityTranslation = await createTempTableCMTranslation(mt);

  endDuration(durationId);

  return {
    County,
    CountyTranslation,
    Municipality,
    MunicipalityTranslation,
  };
}

/**
 * Drop temporary tables
 */
async function dropTempTables(temp) {
  logger.info('Dropping temporary database tables');
  const durationId = startDuration();

  await temp.County.drop();
  await temp.CountyTranslation.drop();
  await temp.Municipality.drop();
  await temp.MunicipalityTranslation.drop();

  endDuration(durationId);
}

// ######################################
// Harvester
// ######################################

/**
 * Retrieves data from Kartverket API and prosesses each item to make sure
 * it is valid and not old and deprecated
 */
async function getData(type) {
  const url = type === 'counties'
    ? COUNTIES_API_URL
    : MUNICIPALITIES_API_URL;

  const options = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  };

  logger.info(`Fetching ${type} from Kartverket-API`);

  let data;
  try {
    const durationId = startDuration();
    const res = await fetch(url, options);

    if (res.status !== 200) {
      throw new Error(res.status);
    }

    data = await res.json();
    endDuration(durationId);
  }
  catch (err) {
    logError(err, 'Unable to fetch data from Kartverket API');
    return null;
  }

  logger.info('Validating data from API');
  const items = [];
  let allItemsValidated = true;
  let ignoredItems = 0;

  data.containeditems.forEach((item) => {
    if (item.lang === 'no') {
      const {
        label,
        uuid,
        description,
        status,
        ValidTo,
      } = item;

      // Validate each relevant field to avoid surprises if Karverket some
      // day change their API
      if (
        isString(label) &&
        isString(uuid) &&
        isString(description) &&
        isString(status) &&
        isValidStatus(status)
      ) {
        // Item is validated, but only include items with the correct status
        // and ValidTo-date
        if (
          status.toLowerCase() !== 'innsendt' &&
          (
            (
              isString(ValidTo) &&
              new Date(ValidTo) > new Date(2010, 1, 1)
            ) ||
            typeof ValidTo === 'undefined'
          )
        ) {
          items.push({
            label,
            uuid,
            description,
            status,
          });
        }
        else {
          ignoredItems += 1;
        }
      }
      // One item failed verification, abort everything!
      else {
        logger.error(
          'Found invalid item in data from Kartverket. ' +
          'Have they changed something?'
        );
        logger.error(JSON.stringify(item, null, '  '));
        allItemsValidated = false;
      }
    }
  });

  logger.info(`Items validated successfully. ${ignoredItems} items ignored`);

  return allItemsValidated ? items : null;
}


/**
 * Process the API data for counties. Add the data to temporary tables,
 * and use it to create or update existing data
 */
async function processCountyData(data, temp) {
  let sql;
  let durationId;
  const countyItems = [];
  const countyTranslationItems = [];

  logger.info('Processing county data');

  data.forEach((item) => {
    const names = item.description.split(' - ');
    const name = names[0];
    const smeName = names.length > 1 ? names[1] : null;
    countyItems.push({
      uuid: item.uuid,
      code: item.label,
      name,
      name_lower_case: name.toLowerCase(),
      status: translateStatus(item.status),
      data_source: DATASOURCE_NAME,
    });

    if (smeName) {
      countyTranslationItems.push({
        uuid: uuid4(),
        name: smeName,
        name_lower_case: smeName.toLowerCase(),
        language: 'sme',
        data_source: DATASOURCE_NAME,
        m_uuid: item.uuid,
      });
    }
  });

  // Bulk insert into temp tables

  if (countyItems.length) {
    logger.info('Inserting counties to temporary table');
    durationId = startDuration();
    await temp.County.bulkCreate(countyItems);
    endDuration(durationId);
  }

  if (countyTranslationItems.length) {
    logger.info('Inserting county translations to temporary table');
    durationId = startDuration();
    await temp.CountyTranslation.bulkCreate(countyTranslationItems);
    endDuration(durationId);
  }

  // Merge counties
  sql = [
    'INSERT INTO county (',
    '  uuid,',
    '  code,',
    '  name,',
    '  name_lower_case,',
    '  status,',
    '  data_source,',
    '  created_at,',
    '  updated_at',
    ')',
    'SELECT',
    '  uuid,',
    '  code,',
    '  name,',
    '  name_lower_case,',
    '  status,',
    '  data_source,',
    '  now(),',
    '  now()',
    `FROM public.${temp.County.tableName}`,
    'ON CONFLICT (uuid) DO UPDATE',
    'SET',
    '  code = EXCLUDED.code,',
    '  name = EXCLUDED.name,',
    '  name_lower_case = EXCLUDED.name_lower_case,',
    '  status = EXCLUDED.status,',
    '  updated_at = now()',
  ].join('\n');

  logger.info('Creating or updating counties');
  durationId = startDuration();
  await db.sequelize.query(sql, { raw: true });
  endDuration(durationId);

  // Merge county translations
  sql = [
    'INSERT INTO county_translation (',
    '  uuid, county_uuid, name, name_lower_case, language, data_source,',
    '  created_at, updated_at',
    ')',
    'SELECT',
    '  uuid, m_uuid, name, name_lower_case, language, data_source, now(),',
    '  now()',
    `FROM public.${temp.CountyTranslation.tableName}`,
    'ON CONFLICT (county_uuid, language)',
    'DO UPDATE',
    'SET',
    '  name = EXCLUDED.name,',
    '  name_lower_case = EXCLUDED.name_lower_case,',
    '  updated_at = now()',
  ].join('\n');

  logger.info('Creating or updating county translations');
  durationId = startDuration();
  await db.sequelize.query(sql, { raw: true });
  endDuration(durationId);

  // Delete old county translations
  sql = [
    'DELETE FROM public.county_translation',
    'USING public.county_translation ct',
    `LEFT JOIN public.${temp.CountyTranslation.tableName} te ON`,
    '  ct.county_uuid = te.m_uuid AND',
    '  ct.language = te.language',
    'WHERE',
    '  te.language IS NULL AND',
    '  ct.data_source = :data_source AND',
    '  public.county_translation.uuid = ct.uuid',
  ].join('\n');

  logger.info('Deleting old county translations');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    raw: true,
    replacements: { data_source: DATASOURCE_NAME },
  });
  endDuration(durationId);

  // Mark counties not found in the new data as deleted
  sql = [
    'UPDATE public.county',
    'SET status = :status, updated_at = now()',
    'FROM public.county c',
    `LEFT JOIN public.${temp.County.tableName} te ON`,
    '  c.uuid = te.uuid',
    'WHERE',
    '  te.uuid IS NULL AND',
    '  c.data_source = :data_source AND',
    '  c.status != :status AND',
    '  public.county.uuid = c.uuid',
  ].join('\n');

  logger.info('Marking counties not found in the new data as deleted');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    raw: true,
    replacements: {
      data_source: DATASOURCE_NAME,
      status: 'deleted',
    },
  });
  endDuration(durationId);

  return countyItems;
}

/**
 * Process the API data for municipalities. Add the data to temporary tables,
 * and use it to create or update existing data
 */
async function processMunicipalityData(data, counties, temp) {
  let sql;
  let durationId;
  const items = [];
  const translationItems = [];

  data.forEach((item) => {
    const names = item.description.split(' - ');
    const name = names[0];
    const smeName = names.length > 1 ? names[1] : null;

    const countyLabel = item.label.substr(0, 2);
    const county = counties.filter((c) => c.code === countyLabel);
    const countyUuid = county[0].uuid;

    items.push({
      uuid: item.uuid,
      county_uuid: countyUuid,
      code: item.label,
      name,
      name_lower_case: name.toLowerCase(),
      status: translateStatus(item.status),
      data_source: DATASOURCE_NAME,
    });

    if (smeName) {
      translationItems.push({
        uuid: uuid4(),
        name: smeName,
        name_lower_case: smeName.toLowerCase(),
        language: 'sme',
        data_source: DATASOURCE_NAME,
        m_uuid: item.uuid,
      });
    }
  });

  // Bulk insert into temp tables

  if (items.length) {
    logger.info('Inserting municipalities to temporary table');
    durationId = startDuration();
    await temp.Municipality.bulkCreate(items);
    endDuration(durationId);
  }

  if (translationItems.length) {
    logger.info('Inserting municipality translations to temporary table');
    durationId = startDuration();
    await temp.MunicipalityTranslation.bulkCreate(translationItems);
    endDuration(durationId);
  }

  // Merge counties
  sql = [
    'INSERT INTO municipality (',
    '  uuid,',
    '  county_uuid,',
    '  code,',
    '  name,',
    '  name_lower_case,',
    '  status,',
    '  data_source,',
    '  created_at,',
    '  updated_at',
    ')',
    'SELECT',
    '  uuid,',
    '  county_uuid,',
    '  code,',
    '  name,',
    '  name_lower_case,',
    '  status,',
    '  data_source,',
    '  now(),',
    '  now()',
    `FROM public.${temp.Municipality.tableName}`,
    'ON CONFLICT (uuid) DO UPDATE',
    'SET',
    '  county_uuid = EXCLUDED.county_uuid,',
    '  code = EXCLUDED.code,',
    '  name = EXCLUDED.name,',
    '  name_lower_case = EXCLUDED.name_lower_case,',
    '  status = EXCLUDED.status,',
    '  updated_at = now()',
  ].join('\n');

  logger.info('Creating or updating municipalities');
  durationId = startDuration();
  await db.sequelize.query(sql, { raw: true });
  endDuration(durationId);

  // Merge county translations
  sql = [
    'INSERT INTO municipality_translation (',
    '  uuid, municipality_uuid, name, name_lower_case, language, data_source,',
    '  created_at, updated_at',
    ')',
    'SELECT',
    '  uuid, m_uuid, name, name_lower_case, language, data_source, now(),',
    '  now()',
    `FROM public.${temp.MunicipalityTranslation.tableName}`,
    'ON CONFLICT (municipality_uuid, language)',
    'DO UPDATE',
    'SET',
    '  name = EXCLUDED.name,',
    '  name_lower_case = EXCLUDED.name_lower_case,',
    '  updated_at = now()',
  ].join('\n');

  logger.info('Creating or updating municipality translations');
  durationId = startDuration();
  await db.sequelize.query(sql, { raw: true });
  endDuration(durationId);

  // Delete old municipality translations
  sql = [
    'DELETE FROM public.municipality_translation',
    'USING public.municipality_translation mt',
    `LEFT JOIN public.${temp.MunicipalityTranslation.tableName} te ON`,
    '  mt.municipality_uuid = te.m_uuid AND',
    '  mt.language = te.language',
    'WHERE',
    '  te.language IS NULL AND',
    '  mt.data_source = :data_source AND',
    '  public.municipality_translation.uuid = mt.uuid',
  ].join('\n');

  logger.info('Deleting old municipality translations');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    raw: true,
    replacements: { data_source: DATASOURCE_NAME },
  });
  endDuration(durationId);

  // Mark counties not found in the new data as deleted
  sql = [
    'UPDATE public.municipality',
    'SET status = :status, updated_at = now()',
    'FROM public.municipality m',
    `LEFT JOIN public.${temp.Municipality.tableName} te ON`,
    '  m.uuid = te.uuid',
    'WHERE',
    '  te.uuid IS NULL AND',
    '  m.data_source = :data_source AND',
    '  public.municipality.uuid = m.uuid',
  ].join('\n');

  logger.info('Marking municipalities not found in the new data as deleted');
  durationId = startDuration();
  await db.sequelize.query(sql, {
    raw: true,
    replacements: {
      data_source: DATASOURCE_NAME,
      status: 'deleted',
    },
  });
  endDuration(durationId);
}


/**
 * Harvest data from Kartverket-API and populate the Neo4j-database.
 * Return `true` on success, and `false` on failure
 */
async function harvest() {
  logger.info('Harvesting counties and municipalities from Kartverket');
  const durationId = startDuration();

  const countiesData = await getData('counties');
  if (countiesData === null) {
    logger.error('No counties found');
    endDuration(durationId);
    return false;
  }

  const municipalityData = await getData('municipalities');
  if (municipalityData === null) {
    logger.error('No municipalities found');
    endDuration(durationId);
    return false;
  }

  // Create temp tables
  const temp = await createTempTables();

  // Process and insert data to database
  const counties = await processCountyData(countiesData, temp);
  await processMunicipalityData(municipalityData, counties, temp);

  // Drop temp tables
  await dropTempTables(temp);

  // Success
  logger.info('Harvesting done');
  endDuration(durationId);
  return true;
}


module.exports = harvest;

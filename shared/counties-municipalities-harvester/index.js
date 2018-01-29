// @flow

import fetch from 'isomorphic-fetch';
import { performance } from 'perf_hooks'; // eslint-disable-line

import {
  printDone,
  logError,
  createLogger,
} from '@turistforeningen/ntb-shared-utils';
import models from '@turistforeningen/ntb-shared-models';


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
// Flow types
// ######################################


type validStatuses = 'public' | 'deleted' | 'draft';


type APIItem = {
  label: string,
  uuid: string,
  description: string,
  status: 'Gyldig' | 'Utgått' | 'Innsendt',
}


// ######################################
// Predicate functions
// ######################################

/**
 * Makes sure the value is a string
 */
function isString(value: string): %checks {
  return typeof value === 'string' || value instanceof String;
}


/**
 * Makes sure the API item status is valid
 */
function isValidStatus(status: string): %checks {
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
function translateStatus(status: string): validStatuses {
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
// Harvester
// ######################################

/**
 * Retrieves data from Kartverket API and prosesses each item to make sure
 * it
 */
async function getData(type: string): Promise<APIItem[] | null> {
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
    performance.mark('a');
    const res = await fetch(url, options);

    if (res.status !== 200) {
      throw new Error(res.status);
    }

    data = await res.json();
    performance.mark('b');
    printDone();
  }
  catch (err) {
    logError(err, 'Unable to fetch data from Kartverket API');
    return null;
  }

  logger.info('Validating data from API');
  const items: APIItem[] = [];
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
 * Process the API data into County instances
 */
function processCountyData(data: APIItem[]): models.County[] {
  const counties = [];

  data.forEach((item) => {
    const names = item.description.split(' - ');
    const name = names[0];
    const smeName = names.length > 1 ? names[1] : null;

    const county = new models.County({
      uuid: item.uuid,
      code: item.label,
      name,
      status: translateStatus(item.status),
      data_source: DATASOURCE_NAME,
    });
    counties.push(county);

    if (smeName) {
      county.setTranslation('sme', smeName);
    }
  });

  return counties;
}

/**
 * Process the API data into Municipality instances
 */
function processMunicipalityData(
  data: APIItem[],
  counties: models.County[]
): models.Municipality[] {
  const municipalities = [];

  data.forEach((item) => {
    const names = item.description.split(' - ');
    const name = names[0];
    const smeName = names.length > 1 ? names[1] : null;

    const municipality = new models.Municipality({
      uuid: item.uuid,
      code: item.label,
      name,
      status: translateStatus(item.status),
      data_source: DATASOURCE_NAME,
    });
    municipalities.push(municipality);

    if (smeName) {
      municipality.setTranslation('sme', smeName);
    }

    const countyLabel = item.label.substr(0, 2);
    const county = counties.filter((c) => c.data.code === countyLabel);
    if (county.length === 1) {
      municipality.setLocatedIn(county[0]);
    }
  });

  return municipalities;
}


/**
 * Harvest data from Kartverket-API and populate the Neo4j-database.
 * Return `true` on success, and `false` on failure
 */
async function harvest(session: neo4j$session): Promise<boolean> {
  const countiesData = await getData('counties');
  if (countiesData === null) {
    return false;
  }

  const municipalityData = await getData('municipalities');
  if (municipalityData === null) {
    return false;
  }

  const counties = processCountyData(countiesData);
  await models.County.saveAll(session, counties, DATASOURCE_NAME);

  const municipalities = processMunicipalityData(municipalityData, counties);
  await models.Municipality.saveAll(session, municipalities, DATASOURCE_NAME);

  // Success
  return true;
}


module.exports = harvest;

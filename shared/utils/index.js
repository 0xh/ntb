import winston from 'winston';
import _ from 'lodash';

import settings from '@ntb/shared-settings';


export { default as _ } from 'lodash';
export { default as moment } from 'moment';
export { default as fetch } from 'isomorphic-fetch';
export { default as uuid4 } from 'uuid/v4';


let DURATION_DATA_AUTO_ID = 0;
const DURATION_DATA = {};


/**
 * Create a winston logger
 */
export function createLogger() {
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
        colorize: true,
        timestamp: true,
        level: settings.ENV_IS_DEVELOPMENT
          ? 'debug'
          : 'info',
      }),
    ],
  });

  return logger;
}


const logger = createLogger();


/**
 * Prints the duration of a durationId of from a specified date up until 'now'
 */
export function printDuration(
  dateOrDurationId,
  messageFormat = '- done: %duration',
  level = 'info'
) {
  // Set date from key or submitted date object
  const date = typeof dateOrDurationId === 'string'
    ? DURATION_DATA[dateOrDurationId]
    : dateOrDurationId;

  // Make sure we found the date object
  if (!date) {
    logger.warn(
      'printDuration(): Unable to determine the duration start date'
    );
  }
  else {
    // Remove from DURATION_DATA if using key
    if (typeof dateOrDurationId === 'string') {
      delete DURATION_DATA[dateOrDurationId];
    }

    // Format and pretty print
    const seconds = (
      (new Date().getTime() - date.getTime()) / 1000
    ).toFixed(3);
    const durationText = `${seconds} s`;
    const message = messageFormat.replace('%duration', durationText);
    logger[level](message);
  }
}


/**
 * Start a duration timer and return the id
 */
export function startDuration(id) {
  let durationId = id;
  if (!durationId) {
    durationId = `__autoid__${DURATION_DATA_AUTO_ID}`;
    DURATION_DATA_AUTO_ID += 1;
  }

  DURATION_DATA[durationId] = new Date();

  return durationId;
}


/**
 * Alias for printDuration()
 */
export function endDuration(durationId, messageFormat, level) {
  printDuration(durationId, messageFormat, level);
}


/**
 * Print the error message and the error stack
 */
export function logError(err, msg) {
  logger.error(`ERROR: ${msg}`);
  logger.error(err);
  logger.error(err.stack);
}
/**
 * Creates a deep clone of the specified object
 * @param {object} obj Object to clone
 */
export function deepClone(obj) {
  const clone = _.clone(obj);

  _.each(clone, (value, key) => {
    if (_.isObject(value)) {
      clone[key] = deepClone(value);
    }
  });

  return clone;
}


/**
 * Removes all null-value keys from the object and any sub object.
 * Returns a new version of the object.
 * @param {object} obj Object to remove keys from
 */
export function removeNull(obj) {
  const res = deepClone(obj);

  _.each(res, (value, key) => {
    if (_.isObject(value)) {
      res[key] = deepClone(value);
    }
    else if (value === null || value === undefined) {
      delete res[key];
    }
  });

  return res;
}


/**
 * Verifies that the specified value is a string
 * @param {*} value value to verify
 */
export function isString(value) {
  return typeof value === 'string' || value instanceof String;
}


/**
 * Verifies that the specified value is a number
 * @param {*} value value to verify
 */
export function isNumber(value) {
  const regex = /^\d+$/g;
  return typeof value === 'number' && Number.isFinite(value)
    ? true
    : regex.test(value);
}


/**
 * Verifies that the specified value is a date
 * @param {*} value value to verify
 */
export function isDate(value) {
  return isNumber(Date.parse(value));
}


/**
 * Verifies that the specified value is a boolean
 * @param {*} value value to verify
 */
export function isBoolean(value) {
  return typeof value === 'boolean';
}


/**
 * Verifies that the specified value is an object
 * @param {*} value value to verify
 */
export function isObject(value) {
  return value && typeof value === 'object' && value.constructor === Object;
}

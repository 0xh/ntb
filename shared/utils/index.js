// eslint-disable-next-line
import { PerformanceObserver, performance } from 'perf_hooks';
import uuid4 from 'uuid/v4';
import winston from 'winston';
import _ from 'lodash';

import settings from '@turistforeningen/ntb-shared-settings';

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
 * Prints the duration between performance measurement marks.
 * As default, it will clear the marks.
 */
const obs = new PerformanceObserver((items) => {
  const time = items.getEntries()[0].duration / 1000;
  logger.info(
    `- done ${time.toFixed(3)} s`
  );
});
obs.observe({ entryTypes: ['measure'] });


export function printDone(m1 = 'a', m2 = 'b', clearMarks = true, comment) {
  const label = `${m1} to ${m2}`;
  performance.measure(label, m1, m2);

  if (clearMarks) {
    performance.clearMarks(m1);
    performance.clearMarks(m2);
  }
}


/**
 * Start a duration timer and return the mark id
 */
export function startDuration(mark) {
  const markId = mark || uuid4();
  performance.mark(markId);
  return markId;
}


/**
 * Given a starting mark id, end the duration timer and print the results
 */
export function endDuration(startMark, comment) {
  const endMark = uuid4();
  performance.mark(endMark);
  printDone(startMark, endMark, true, comment);
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

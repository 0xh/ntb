import db from '@turistforeningen/ntb-shared-models';
import { isNumber } from '@turistforeningen/ntb-shared-utils';

import APIError from './APIError';


function setValidKeys(handler) {
  const validKeys = ['fields'];
  const { config } = handler;

  // Pagination keys
  if (config.paginate) {
    validKeys.push('limit');
    validKeys.push('offset');
  }

  // Ordering key
  if (config.ordering) {
    validKeys.push('order');
  }

  // Full text search key
  if (config.fullTextSearch) {
    validKeys.push('q');
  }

  // Full text search key
  if (config.include && Object.keys(config.include).length) {
    validKeys.push('e');
  }

  handler.validKeys = validKeys;
}


function validateKeys(handler) {
  const keys = Object.keys(handler.queryObject);

  keys.forEach((key) => {
    if (!handler.validKeys.includes(key)) {
      // Add errors on invalid query parameters (?queryparam)
      const queryStringKeys = Object.keys(
        handler.trace.queryStringObject || {}
      );
      const invalidKeys = queryStringKeys
        .filter((k) => k.startsWith(`${key}.`));
      if (invalidKeys.length) {
        invalidKeys.forEach((invalid) => {
          handler.errors.push(`Invalid query parameter: ${invalid}`);
        });
      }
      // Add generic error
      else {
        handler.errors.push(
          `Invalid query parameter: ${handler.trace.parent}${key}`
        );
      }

      delete handler.queryObject[key];
    }
  });
}

/**
 * Validate limit option
 * @param {object} queryObject
 * @param {object} handler
 */
function validateLimit(queryObject, handler) {
  const { config, trace } = handler;

  if (!config.defaultLimit) {
    throw new Error('defaultLimit is not set in apiConfig');
  }

  if (!config.maxLimit) {
    throw new Error('maxLimit is not set in apiConfig');
  }

  if (isNumber(queryObject.limit)) {
    const limit = +queryObject.limit;
    if (limit > 0 && limit <= config.maxLimit) {
      return limit;
    }
  }

  if (queryObject.limit) {
    handler.errors.push(`Invalid ${trace.parent}limit value`);
  }

  return config.defaultLimit;
}

/**
 * Validate offset option
 * @param {object} requestOptions
 * @param {object} handler
 */
function validateOffset(queryObject, handler) {
  const { offset } = queryObject;
  if (!queryObject.offset) {
    return 0;
  }

  if (isNumber(offset)) {
    const numOffset = +queryObject.offset;
    if (numOffset >= 0 && numOffset <= Number.MAX_SAFE_INTEGER) {
      return numOffset;
    }
  }

  const { trace } = handler;
  handler.errors.push(`Invalid ${trace.parent}offset value`);

  return 0;
}


function setPaginationValues(handler) {
  const { config } = handler;
  if (config.paginate) {
    const { requestParameters, queryObject } = handler;
    requestParameters.limit = validateLimit(queryObject, handler);
    requestParameters.offset = validateOffset(queryObject, handler);
  }
}


function setOrdering(handler) {
  const {
    config,
    queryObject,
    requestParameters,
    trace,
  } = handler;

  if (!config.defaultOrder) {
    throw new Error('defaultOrder is not set in apiConfig');
  }

  if (!config.validOrderFields) {
    throw new Error('validOrderFields is not set in apiConfig');
  }

  requestParameters.order = config.defaultOrder;

  if (config.ordering && queryObject.order) {
    if (!Array.isArray(queryObject.order)) {
      handler.errors.push(`Invalid ${trace.parent}order value`);
    }
    else {
      let valid = true;
      queryObject.order.forEach((o) => {
        if (
          !Array.isArray(o)
          || o.length !== 2
          || !config.validOrderFields.includes(o[0])
          || (o[1] !== 'asc' && o[2] !== 'desc')
        ) {
          valid = false;
        }
      });

      if (valid) {
        requestParameters.order = queryObject.order;
      }
      else {
        handler.errors.push(`Invalid ${trace.parent}order value`);
      }
    }
  }
}


function setFields(handler) {
  const {
    config,
    queryObject,
    requestParameters,
    trace,
  } = handler;

  if (!config.validFields) {
    throw new Error('validFields is not set in apiConfig');
  }

  let validFieldKeys = config.validFields.map((f) => f[0]);
  validFieldKeys = validFieldKeys.concat(Object.keys(config.include || {}));
  requestParameters.fields = config.validFields
    .filter((f) => f[1])
    .map((f) => f[0]);

  if (queryObject.fields) {
    if (!Array.isArray(queryObject.fields)) {
      handler.errors.push(`Invalid ${trace.parent}field value`);
    }
    else {
      let valid = false;
      queryObject.fields.forEach((field) => {
        if (!validFieldKeys.includes(field)) {
          handler.errors.push(`Invalid ${trace.parent}field value "${field}"`);
          valid = false;
        }
      });

      if (valid) {
        requestParameters.fields = queryObject.fields;
      }
    }
  }
}


function processRequestParameters(
  model,
  referrer,
  queryObject,
  trace,
  errors
) {
  const handler = {
    requestParameters: {},
    queryObject,
    errors,
    trace,
  };

  const { byReferrer } = model.getAPIConfig(db);
  handler.config = Object.keys(byReferrer).includes(referrer)
    ? byReferrer[referrer]
    : byReferrer.default;

  setValidKeys(handler);
  validateKeys(handler);
  setPaginationValues(handler);
  setOrdering(handler);
  setFields(handler);

  return handler.requestParameters;
}


/**
 * Validate and processes queryObject into request parameters used by the
 * process-request module.
 * @param {object} entryModel The entry db.model
 * @param {object} input a preconfigured nested query object
 * @param {object} trace
 */
export default function (entryModel, queryObject, queryStringObject) {
  const errors = [];
  const trace = {
    queryStringObject,
    parent: '',
  };
  const requestParameters = processRequestParameters(
    entryModel, '*onEntry', queryObject, trace, errors
  );

  if (errors.length) {
    throw new APIError('The query is not valid', { apiErrors: errors });
  }

  return requestParameters;
}

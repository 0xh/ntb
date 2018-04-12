import _ from 'lodash';

import db from '@turistforeningen/ntb-shared-models';
import { isNumber } from '@turistforeningen/ntb-shared-utils';

import APIError from './APIError';

/**
 * Get the value(s) from the specified key from the queryObject. This is a
 * case insensitive way of parsing the query object.
 * @param {object} queryObject
 * @param {string} key
 */
function getKeyValue(queryObject, key) {
  const values = [];
  Object.keys(queryObject).forEach((rawKey) => {
    const k = _.camelCase(rawKey.split('.', 1)[0].toLowerCase().trim());
    if (k === key) {
      values.push({
        originalKey: rawKey,
        value: queryObject[rawKey],
      });
    }
  });

  return values.length ? values : null;
}


/**
 * Using the specified APIConfig, this funciton returns a lists of all valid
 * query parameters
 * @param {object} handler
 */
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


/**
 * General key validation. Reports error on any unknown key.
 * @param {*} handler
 */
function validateKeys(handler) {
  const keys = Object.keys(handler.queryObject);

  keys.forEach((rawKey) => {
    const key = _.camelCase(rawKey.split('.', 1)[0].toLowerCase().trim());
    if (!handler.validKeys.includes(key)) {
      // Add errors on invalid query parameters (?queryparam)
      handler.errors.push(
        `Invalid query parameter: ${handler.trace}${rawKey}`
      );

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
  const { config } = handler;

  if (!config.defaultLimit) {
    throw new Error('defaultLimit is not set in apiConfig');
  }

  if (!config.maxLimit) {
    throw new Error('maxLimit is not set in apiConfig');
  }

  const queryLimit = getKeyValue(queryObject, 'limit');
  if (queryLimit) {
    const qLimit = queryLimit[0];
    if (isNumber(qLimit.value)) {
      const limit = +qLimit.value;
      if (limit > 0 && limit <= config.maxLimit) {
        return limit;
      }
    }

    if (qLimit.value) {
      const { trace } = handler;
      handler.errors.push(
        `Invalid ${trace}${qLimit.originalKey} value "${qLimit.value}"`
      );
    }
  }

  return config.defaultLimit;
}


/**
 * Validate offset option
 * @param {object} queryObject
 * @param {object} handler
 */
function validateOffset(queryObject, handler) {
  const queryOffset = getKeyValue(queryObject, 'offset');
  if (queryOffset) {
    const qOffset = queryOffset[0];

    if (isNumber(qOffset.value)) {
      const numOffset = +qOffset.value;
      if (numOffset >= 0 && numOffset <= Number.MAX_SAFE_INTEGER) {
        return numOffset;
      }
    }

    const { trace } = handler;
    handler.errors.push(
      `Invalid ${trace}${qOffset.originalKey} value "${qOffset.value}"`
    );
  }

  return 0;
}


/**
 * Sets the pagination values (limit and offset)
 * @param {*} handler
 */
function setPaginationValues(handler) {
  const { config } = handler;
  if (config.paginate) {
    const { requestParameters, queryObject } = handler;
    requestParameters.limit = validateLimit(queryObject, handler);
    requestParameters.offset = validateOffset(queryObject, handler);
  }
}


/**
 * Validates and sets database ordering from the ?order=... query parameter
 * @param {object} handler
 */
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

  if (config.ordering) {
    const queryOrder = getKeyValue(queryObject, 'order');
    if (queryOrder && queryOrder[0].value) {
      const qOrder = queryOrder[0];
      let values = qOrder.value;

      // Convert to array
      if (!Array.isArray(values)) {
        values = values.split(',').map((v) => v.trim());
      }

      // Filter empty values
      values = values.filter((v) => v);

      // Used for reporting errors
      qOrder.errorReportingValue = Array.isArray(qOrder.value)
        ? qOrder.value.join(', ')
        : qOrder.value;

      // If empty, the parameter is invalid
      if (!values.length) {
        handler.errors.push(
          `Invalid ${trace}${qOrder.originalKey} value ` +
          `"${qOrder.errorReportingValue}"`
        );
      }
      else {
        let valid = false;
        const order = [];
        values.forEach((orderExpression) => {
          const o = orderExpression.split(' ');

          if (o.length !== 2) {
            handler.errors.push(
              `Invalid ${trace}${qOrder.originalKey} value ` +
              `"${qOrder.errorReportingValue}"` +
              `${values.length > 1 ? ` on "${orderExpression}".` : '. '}` +
              'The correct format is "<field_name> asc|desc"'
            );
            valid = false;
          }
          else {
            o[0] = _.camelCase(o[0].toLowerCase().trim());
            o[1] = o[1].toLowerCase().trim();

            if (!config.validOrderFields.includes(o[0])) {
              handler.errors.push(
                `Invalid ${trace}${qOrder.originalKey} value ` +
                `"${qOrder.errorReportingValue}"` +
                `${values.length > 1 ? ` on "${orderExpression}".` : '. '}` +
                'The field name is not a valid order field.'
              );
              valid = false;
            }
            if (o[1] !== 'asc' && o[2] !== 'desc') {
              handler.errors.push(
                `Invalid ${trace}${qOrder.originalKey} value ` +
                `"${qOrder.errorReportingValue}"` +
                `${values.length > 1 ? ` on "${orderExpression}".` : '. '}` +
                'The order direction must be either "asc" or "desc".'
              );
              valid = false;
            }

            order.push([o[0], o[1]]);
          }
        });

        if (valid && order.length) {
          requestParameters.order = order;
        }
      }
    }
  }
}


/**
 * Validates and sets fields from the ?fields=... parameter.
 * @param {object} handler
 */
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

  const queryFields = getKeyValue(queryObject, 'fields');
  if (queryFields && queryFields[0].value) {
    const qFields = queryFields[0];
    let values = qFields.value;

    // Convert to array
    if (!Array.isArray(values)) {
      values = values.split(',').map((v) => v.trim());
    }

    // Filter empty values
    values = values.filter((v) => v);

    // Used for reporting errors
    qFields.errorReportingValue = Array.isArray(qFields.value)
      ? qFields.value.join(', ')
      : qFields.value;

    // If empty, the parameter is invalid
    if (!values.length) {
      handler.errors.push(
        `Invalid ${trace}${qFields.originalKey} value ` +
        `"${qFields.errorReportingValue}"`
      );
    }
    else {
      let valid = false;
      const fields = [];
      values.forEach((fieldExpression) => {
        const f = _.camelCase(fieldExpression.toLowerCase().trim());
        if (!validFieldKeys.includes(f)) {
          handler.errors.push(
            `Invalid ${trace}${qFields.originalKey} value ` +
            `"${qFields.errorReportingValue}"` +
            `${values.length > 1 ? ` on "${fieldExpression}".` : '. '}` +
            'This is not a valid field.'
          );
          valid = false;
        }

        fields.push(f);
      });

      // All fields validated
      if (valid && fields.length) {
        requestParameters.fields = fields;
      }
    }
  }
}


/**
 * Used as a recursive function to process models and any extend-models
 * @param {object} model
 * @param {string} referrer
 * @param {object} handler
 */
function processRequestParameters(model, referrer, handler) {
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
 * @param {object} queryObject a preconfigured nested query object or the
 *                             ExpressJS req.query object
 */
export default function (entryModel, queryObject) {
  const handler = {
    requestParameters: {},
    errors: [],
    trace: '',
    queryObject,
  };
  processRequestParameters(entryModel, '*onEntry', handler);

  if (handler.errors.length) {
    throw new APIError(
      'The query is not valid',
      { apiErrors: handler.errors }
    );
  }

  return handler.requestParameters;
}

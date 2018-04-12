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
    const { sequelizeOptions, queryObject } = handler;
    sequelizeOptions.limit = validateLimit(queryObject, handler);
    sequelizeOptions.offset = validateOffset(queryObject, handler);
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
    sequelizeOptions,
    trace,
  } = handler;

  if (!config.defaultOrder) {
    throw new Error('defaultOrder is not set in apiConfig');
  }

  if (!config.validOrderFields) {
    throw new Error('validOrderFields is not set in apiConfig');
  }

  sequelizeOptions.order = config.defaultOrder;

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
          sequelizeOptions.order = order;
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
    trace,
  } = handler;

  if (!config.validFields) {
    throw new Error('validFields is not set in apiConfig');
  }

  let validFieldKeys = Object.keys(config.validFields);
  validFieldKeys = validFieldKeys.concat(Object.keys(config.include || {}));
  handler.fields = Object.keys(config.validFields)
    .filter((f) => config.validFields[f]);

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
      let valid = true;
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
        handler.fields = fields;
      }
    }
  }
}


/**
 * Use a list of fields to process which attributes shouldb e returned from
 * the database
 */
function setAttributes(handler) {
  // translate fields to attributes for fields which are not includes/extends
  handler.sequelizeOptions.attributes = handler.model.fieldsToAttributes(
    handler.fields
      .filter((f) => !Object.keys(handler.config.include).includes(f))
  );
}


/**
 * Set list of associations to be included
 * @param {object} handler
 */
function setIncludes(handler) {
  const { queryObject, config } = handler;

  // Do nothing if the model api configuration does not define any
  if (!config.include || !Object.keys(config.include).length) {
    return;
  }

  // Use defaults if not fields value is set
  let useDefaults = true;
  const queryFields = getKeyValue(queryObject, 'fields');
  if (queryFields && queryFields[0].value) {
    useDefaults = false;
  }

  if (useDefaults) {
    Object.keys(config.include).forEach((key) => {
      const includeOptions = config.include[key];
      if (includeOptions.includeByDefault) {
        handler.include[key] = includeOptions;
      }
    });
  }
  // Include only those specified in fields
  else {
    Object.keys(config.include).forEach((key) => {
      if (handler.fields.includes(key)) {
        handler.include[key] = config.include[key];
      }
    });
  }
}


function getExtendQueryObject(handler, key) {
  let extendQueryObject = {};
  const values = getKeyValue(handler.queryObject, 'e');
  if (values && values.length) {
    // If its a formatted object
    if (values.length === 1 && values[0].originalKey === 'e') {
      if (values[0].value[key]) {
        extendQueryObject = values[0].value[key];
      }
    }
    // If it's string named e.[key].<opt_name>
    else {
      values.forEach((value) => {
        const prefix = `e.${key}.`;
        if (value.originalKey.startsWith(prefix)) {
          const k = value.originalKey.substr(prefix.length);
          extendQueryObject[k] = value.value;
        }
      });
    }
  }

  return extendQueryObject;
}


function getDefaultHandler(model, queryObject, errors = [], trace = '') {
  return {
    sequelizeOptions: {},
    fields: [],
    include: {},
    errors,
    trace,
    model,
    queryObject,
  };
}


function returnFromHandler(handler) {
  return {
    fields: handler.fields,
    include: handler.include,
    sequelizeOptions: handler.sequelizeOptions,
  };
}


/**
 * Used as a recursive function to process models and any extend-models
 * @param {object} model
 * @param {string} referrer
 * @param {object} handler
 */
function processRequestParameters(referrer, handler) {
  const { byReferrer } = handler.model.getAPIConfig(db);
  handler.config = Object.keys(byReferrer).includes(referrer)
    ? byReferrer[referrer]
    : byReferrer.default;

  setValidKeys(handler);
  validateKeys(handler);
  setPaginationValues(handler);
  setOrdering(handler);
  setFields(handler);
  setAttributes(handler);
  setIncludes(handler);


  // Update sequelizeOptions with includes and recursive request parameter
  // processing
  if (Object.keys(handler.include).length) {
    const { sequelizeOptions } = handler;
    sequelizeOptions.include = [];
    Object.keys(handler.include).forEach((key) => {
      const extendQueryObject = getExtendQueryObject(handler, key);
      const { association } = handler.include[key];
      const extendModel = association
        ? handler.model.associations[association].target
        : handler.include[key].model;

      const extendHandler = getDefaultHandler(
        extendModel,
        extendQueryObject,
        handler.errors,
        `e.${handler.trace}${key}.`
      );
      processRequestParameters(`${handler.model.name}.${key}`, extendHandler);

      // If it should be included in the main query
      if (association) {
        sequelizeOptions.include.push({
          association: handler.include[key].association,
          ...extendHandler.sequelizeOptions,
        });
      }
      // Add options to handler.include
      else {
        handler.include[key] = {
          ...handler.include[key],
          ...returnFromHandler(extendHandler),
        };
      }
    });
  }
}


/**
 * Validate and processes queryObject into request parameters used by the
 * process-request module.
 * @param {object} entryModel The entry db.model
 * @param {object} queryObject a preconfigured nested query object or the
 *                             ExpressJS req.query object
 */
export default function (entryModel, queryObject) {
  const handler = getDefaultHandler(entryModel, queryObject);
  processRequestParameters('*onEntry', handler);

  if (handler.errors.length) {
    throw new APIError(
      'The query is not valid',
      { apiErrors: handler.errors }
    );
  }

  return returnFromHandler(handler);
}

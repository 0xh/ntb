import _ from 'lodash';

import db from '@turistforeningen/ntb-shared-models';
import {
  isNumber,
  isObject,
} from '@turistforeningen/ntb-shared-utils';

import validateAndProcessFilters from './validate-and-process-filters';


function getNextReferrerId(handler, key) {
  let nextReferrer = [`${handler.model.name}.${key}`];
  if (handler.id) {
    nextReferrer = [
      `${handler.model.name}.single.${key}`,
    ].concat(nextReferrer);
  }
  return nextReferrer;
}


function getAPIConfig(model, referrer) {
  const { byReferrer } = model.getAPIConfig(db);
  let config;

  referrer.forEach((ref) => {
    if (!config && byReferrer[ref]) {
      config = byReferrer[ref];
    }
  });
  if (!config) {
    config = byReferrer.default;
  }

  return config;
}


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
  let validKeys = ['fields'];
  const validDotKeys = [];
  const { config, association } = handler;
  const associationType = association
    ? association.associationType
    : null;

  // Enable pagination if not association, or a multiple-association
  if (!association || !['BelongsTo'].includes(associationType)) {
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
  }

  // Include keys
  Object.keys(config.include || {}).forEach((key) => {
    validKeys.push(key);
    validDotKeys.push(key);
  });

  // Filter keys
  const validFilters = { self: [], includes: {} };
  if (!handler.id) {
    validFilters.self = Object.keys((handler.config.validFilters || {}));

    // Valid include filters
    Object.keys(config.include || {}).forEach((key) => {
      const referrer = getNextReferrerId(handler, key);
      const associationName = config.include[key].association;
      const model = handler.model.associations[associationName].target;
      const includeAPIConfig = getAPIConfig(model, referrer);
      const validIncludeFilters = Object.keys(
        includeAPIConfig.validFilters || {}
      );

      if (validIncludeFilters.length) {
        validFilters.includes[key] = validIncludeFilters;
      }
    });

    // Enable `df` if this is an associated reference (not main entry model)
    if (
      handler.usExpressJSQueryObject
      && handler.association
      && validFilters.self.length
    ) {
      validKeys.push('df');
      validDotKeys.push('df');
    }
    // Enable keys for all named filters on model
    else if (handler.usExpressJSQueryObject) {
      validKeys = validKeys.concat(validFilters.self);
    }
    // If it's a structured object, enable the `filters` key
    else if (
      validFilters.self.length
      || Object.keys(validFilters.includes).length
    ) {
      validKeys.push('filters');
    }
  }

  handler.validKeys = validKeys;
  handler.validDotKeys = validDotKeys;
  handler.validFilters = validFilters;
}


/**
 * General key validation. Reports error on any unknown key.
 * @param {*} handler
 */
function validateKeys(handler) {
  const keys = Object.keys(handler.queryObject);

  keys.forEach((rawKey) => {
    const key = _.camelCase(rawKey.split('.', 1)[0].toLowerCase().trim());
    if (
      !handler.validKeys.includes(key)
      || (
        rawKey.includes('.')
        && !handler.validDotKeys.includes(key)
      )
    ) {
      // Add errors on invalid query parameters (?queryparam)
      handler.errors.push(
        `Invalid query parameter: ${handler.trace}${rawKey}`
      );

      delete handler.queryObject[key];
    }

    if (handler.validDotKeys.includes(key)) {
      const dotCount = (rawKey.match(/\./g) || []).length;
      if (dotCount < 1 && !isObject(handler.queryObject[key])) {
        handler.errors.push(
          `Invalid query parameter format: ${handler.trace}${rawKey}`
        );
      }

      delete handler.queryObject.e;
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

  const queryLimit = getKeyValue(queryObject, 'limit');
  if (queryLimit) {
    const qLimit = queryLimit[0];
    let { value } = qLimit;

    // Only allow one 'limit=' for ExpressJS
    if (handler.usExpressJSQueryObject && value.length > 1) {
      handler.errors.push(
        `Invalid ${trace}${qLimit.originalKey}. ` +
        'There are multiple occurences in the url.'
      );
      value = 10;
    }
    else if (handler.usExpressJSQueryObject) {
      ([value] = value);
    }

    if (isNumber(value)) {
      const limit = +value;
      if (limit >= 0 && limit <= config.maxLimit) {
        return limit;
      }
    }

    if (qLimit.value) {
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
  const { trace } = handler;
  const queryOffset = getKeyValue(queryObject, 'offset');

  if (queryOffset) {
    const qOffset = queryOffset[0];
    let { value } = qOffset;

    // Only allow one 'offset=' for ExpressJS
    if (handler.usExpressJSQueryObject && value.length > 1) {
      handler.errors.push(
        `Invalid ${trace}${qOffset.originalKey}. ` +
        'There are multiple occurences in the url.'
      );
      value = 0;
    }
    else if (handler.usExpressJSQueryObject) {
      ([value] = value);
    }

    if (isNumber(value)) {
      const numOffset = +value;
      if (numOffset >= 0 && numOffset <= Number.MAX_SAFE_INTEGER) {
        return numOffset;
      }
    }

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

      // Only allow one 'order=' for ExpressJS
      if (handler.usExpressJSQueryObject && values.length > 1) {
        handler.errors.push(
          `Invalid ${trace}${qOrder.originalKey}. ` +
          'There are multiple occurences in the url.'
        );
        return;
      }
      else if (handler.usExpressJSQueryObject) {
        ([values] = values);
      }

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
        let valid = true;
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
            if (o[1] !== 'asc' && o[1] !== 'desc') {
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
    association,
  } = handler;

  if (!config.validFields) {
    throw new Error('validFields is not set in apiConfig');
  }

  const validFieldKeys = Object.keys(config.validFields);
  let validThroughFieldKeys = [];
  const validIncludeKeys = Object.keys(config.include || {});

  if (association && association.through) {
    const APIThroughFields = association.through.model.getAPIThroughFields(
      association.source.name
    );
    validThroughFieldKeys = Object.keys(APIThroughFields || {});
    handler.throughFields = validThroughFieldKeys
      .filter((f) => (APIThroughFields || {})[f]);
  }

  // Set default fields
  handler.fields = Object.keys(config.validFields)
    .filter((f) => config.validFields[f]);
  handler.includeFields = (
    validIncludeKeys.filter((k) => config.include[k].includeByDefault)
  );

  const queryFields = getKeyValue(queryObject, 'fields');
  if (queryFields && queryFields[0].value) {
    const qFields = queryFields[0];
    let values = qFields.value;

    // Only allow one 'fields=' for ExpressJS
    if (handler.usExpressJSQueryObject && values.length > 1) {
      handler.errors.push(
        `Invalid ${trace}${qFields.originalKey}. ` +
        'There are multiple occurences in the url.'
      );
      return;
    }
    else if (handler.usExpressJSQueryObject) {
      ([values] = values);
    }

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
      const includeFields = [];
      const throughFields = [];
      values.forEach((fieldExpression) => {
        const f = _.camelCase(fieldExpression.toLowerCase().trim());
        if (
          !validFieldKeys.includes(f)
          && !validThroughFieldKeys.includes(f)
          && !validIncludeKeys.includes(f)
        ) {
          handler.errors.push(
            `Invalid ${trace}${qFields.originalKey} value ` +
            `"${qFields.errorReportingValue}"` +
            `${values.length > 1 ? ` on "${fieldExpression}". ` : '. '}` +
            'This is not a valid field.'
          );
          valid = false;
        }

        if (validIncludeKeys.includes(f)) {
          includeFields.push(f);
        }
        else if (validThroughFieldKeys.includes(f)) {
          throughFields.push(f);
        }
        else {
          fields.push(f);
        }
      });

      // All fields validated
      if (
        valid
        && (
          fields.length
          || includeFields.length
          || throughFields.length
        )
      ) {
        handler.fields = fields;
        handler.throughFields = throughFields;
        handler.includeFields = includeFields;
      }
    }
  }
}


function setFilters(handler) {
  if (handler.id) {
    handler.sequelizeOptions.where = {
      uuid: handler.id,
    };
    return;
  }

  validateAndProcessFilters(handler);
}


function validateIncludeKeys(handler) {
  const keys = Object.keys(handler.queryObject);

  keys.forEach((rawKey) => {
    const rawKeys = rawKey.split('.');
    const key = _.camelCase(rawKeys[0].toLowerCase().trim());
    let subKey;
    if (rawKeys.length > 1) {
      subKey = _.camelCase(rawKeys.slice(1)
        .join('.')
        .toLowerCase()
        .trim());
    }

    if (Object.keys(handler.config.include).includes(key)) {
      const rawIncludeKeys = rawKey.split('.');
      const rawIncludeKey = rawIncludeKeys[0].trim();
      let rawSubKey;

      if (rawIncludeKeys.length > 1) {
        rawSubKey = rawIncludeKeys.slice(1).join('.').trim();
      }

      if (
        subKey
        && subKey.length
        && !['limit', 'offset', 'order', 'df'].includes(subKey)
        && !handler.includeFields.includes(key)
        && Object.keys(handler.validFilters.includes).includes(key)
        && !handler.validFilters.includes[key].includes(subKey)
      ) {
        handler.errors.push(
          `Invalid query parameter: ${handler.trace}${rawKey}. ` +
          `"${rawSubKey}" is not a valid filter on "${rawIncludeKey}"."`
        );
      }
      else if (
        !handler.includeFields.includes(key)
        && (
          !subKey
          || !subKey.length
          || ['limit', 'offset', 'order', 'df'].includes(subKey)
        )
      ) {
        handler.errors.push(
          `Invalid query parameter: ${handler.trace}${rawKey}. ` +
          `"${rawIncludeKey}" is not included in fields."`
        );
      }
    }
  });
}


/**
 * Use a list of fields to process which attributes shouldb e returned from
 * the database
 */
function setAttributes(handler) {
  // translate fields to attributes for fields which are not includes/extends
  const fieldsToConvert = handler.fields
    .filter((f) => !Object.keys((handler.config.include || {})).includes(f));
  handler.sequelizeOptions.attributes = handler.model.fieldsToAttributes(
    fieldsToConvert
  );

  // Make sure the primary keys are always selected
  Object.keys(handler.model.primaryKeys).forEach((key) => {
    if (!handler.sequelizeOptions.attributes.includes(key)) {
      handler.sequelizeOptions.attributes.push(key);
    }
  });

  // Make sure the fields needed for includes from this model are always
  // selected
  Object.keys((handler.include || {})).forEach((includeKey) => {
    const { association } = handler.include[includeKey];

    let identifier;
    if (association.manyFromSource) {
      identifier = association.manyFromSource.sourceIdentifier;
    }
    else if (association.identifier) {
      ({ identifier } = association);
    }
    else if (association.foreignKey) {
      identifier = association.foreignKey;
    }
    else {
      throw new Error('Unable to determine the correct key');
    }

    if (!handler.sequelizeOptions.attributes.includes(identifier)) {
      handler.sequelizeOptions.attributes.push(identifier);
    }
  });

  // Make sure the fields needed for includes to this model are always sleected
  if (
    handler.association
    && handler.association.isMultiAssociation
    && !handler.association.through
  ) {
    const { targetKey } = handler.association.options;
    if (!handler.sequelizeOptions.attributes.includes(targetKey)) {
      handler.sequelizeOptions.attributes.push(targetKey);
    }
  }

  // Make sure the order by key is always selected
  (handler.sequelizeOptions.order || []).forEach((orderKey) => {
    if (!handler.sequelizeOptions.attributes.includes(orderKey[0])) {
      handler.sequelizeOptions.attributes.push(orderKey[0]);
    }
  });

  // Translate through fields
  if (handler.throughFields.length) {
    const throughFields = [...handler.throughFields];

    handler.throughAttributes =
      handler.association.through.model.fieldsToAttributes(
        handler.association.source.name, throughFields
      );

    const sourceIdentifier = handler.association.toSource.identifier;
    if (!handler.throughAttributes.includes(sourceIdentifier)) {
      handler.throughAttributes.push(sourceIdentifier);
    }
  }
}


/**
 * Set list of associations to be included
 * @param {object} handler
 */
function setIncludes(handler) {
  const { config } = handler;

  // Do nothing if the model api configuration does not define any
  if (!config.include || !Object.keys(config.include).length) {
    return;
  }

  handler.includeFields.forEach((key) => {
    handler.include[key] = config.include[key];
  });
}


/**
 * Process current queryObject and get values defined for the extend model
 * @param {object} handler
 * @param {key} key
 */
function getIncludeQueryObject(handler, key) {
  let extendQueryObject = {};
  const values = getKeyValue(handler.queryObject, key);
  const snakedKey = _.snakeCase(key);

  if (values && values.length) {
    // If its a formatted object
    if (values.length === 1 && values[0].originalKey === snakedKey) {
      if (values[0].value) {
        extendQueryObject = values[0].value;
      }
    }
    // If it's string named [snakedKey].<opt_name>
    else {
      values.forEach((value) => {
        const prefix = `${snakedKey}.`;
        if (value.originalKey.startsWith(prefix)) {
          const subKey = value.originalKey.substr(prefix.length);

          // If it's not a valid include-filter on the current model
          if (
            !Object.keys(handler.validFilters.includes).includes(key)
            || !handler.validFilters.includes[key].includes(subKey)
          ) {
            extendQueryObject[subKey] = value.value;
          }
        }
      });
    }
  }

  return extendQueryObject;
}


/**
 * Get handler object with default values
 * @param {object} model
 * @param {object} queryObject
 * @param {array} errors
 * @param {string} trace
 */
function getDefaultHandler(
  model,
  queryObject,
  usExpressJSQueryObject,
  errors = [],
  trace = '',
) {
  return {
    sequelizeOptions: {},
    fields: [],
    throughFields: [],
    includeFields: [],
    include: {},
    errors,
    trace,
    model,
    queryObject,
    usExpressJSQueryObject,
  };
}


/**
 * Pick relevant keys from the handler object
 * @param {object} handler
 */
function pickFromHandlerObject(handler) {
  return {
    fields: handler.fields,
    throughFields: handler.throughFields,
    throughAttributes: handler.throughAttributes,
    includeFields: handler.includeFields,
    model: handler.model,
    config: handler.config,
    include: handler.include,
    sequelizeOptions: handler.sequelizeOptions,
    association: handler.association,
    id: handler.id,
    usExpressJSQueryObject: handler.usExpressJSQueryObject,
  };
}


/**
 * Used as a recursive function to process models and any extend-models
 * @param {string} referrer
 * @param {object} handler
 */
function processRequestParameters(referrer, handler) {
  handler.config = getAPIConfig(handler.model, referrer);

  if (handler.id) {
    handler.config.paginate = false;
    handler.config.order = false;
    handler.config.fullTextSearch = false;
    handler.config.disableFilters = true;
  }

  setValidKeys(handler);
  validateKeys(handler);
  setPaginationValues(handler);
  setOrdering(handler);
  setFields(handler);
  setFilters(handler);
  validateIncludeKeys(handler);
  setIncludes(handler);


  // Update sequelizeOptions with includes and recursive request parameter
  // processing
  if (Object.keys(handler.include).length) {
    Object.keys(handler.include).forEach((key) => {
      const extendQueryObject = getIncludeQueryObject(handler, key);
      const associationKey = handler.include[key].association;
      const association = handler.model.associations[associationKey];

      const extendHandler = getDefaultHandler(
        association.target,
        extendQueryObject,
        handler.usExpressJSQueryObject,
        handler.errors,
        `${handler.trace}${key}.`
      );
      extendHandler.association = association;

      const nextReferrer = getNextReferrerId(handler, key);
      processRequestParameters(nextReferrer, extendHandler);

      handler.include[key] = {
        ...handler.include[key],
        ...pickFromHandlerObject(extendHandler),
        id: null,
      };
    });
  }

  // Set attributes to be included in the SQL
  setAttributes(handler);
}


function convertExpressJSparamsToArrays(queryObject) {
  const res = {};
  Object.keys(queryObject).forEach((key) => {
    res[key] = Array.isArray(queryObject[key])
      ? queryObject[key]
      : [queryObject[key]];
  });
  return res;
}


/**
 * Validate and processes queryObject into request parameters used by the
 * process-request module.
 * @param {object} entryModel The entry db.model
 * @param {object} queryObject a preconfigured nested query object or the
 *                             ExpressJS req.query object
 * @param {string} queryObject id of a single object
 */
export default function (
  entryModel,
  queryObject,
  id = null,
  usExpressJSQueryObject = true
) {
  const qObject = usExpressJSQueryObject
    ? convertExpressJSparamsToArrays(queryObject)
    : queryObject;
  const handler = getDefaultHandler(
    entryModel, qObject, usExpressJSQueryObject
  );
  handler.id = id;

  const referrer = id ? '*single' : '*list';
  processRequestParameters([referrer], handler);

  return [handler.errors, pickFromHandlerObject(handler)];
}

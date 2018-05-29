import _ from 'lodash';

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
  const apiConfig = model.getAPIConfig();
  let selectedConfig;

  referrer.forEach((ref) => {
    if (!selectedConfig && apiConfig[ref]) {
      selectedConfig = apiConfig[ref];
    }
  });
  if (!selectedConfig) {
    selectedConfig = apiConfig.default;
  }

  // Set some defaults
  selectedConfig.validRelationFilters = {};

  return selectedConfig;
}


/**
 * Get the value(s) from the specified key from the requestObject. This is a
 * case insensitive way of parsing the query object.
 * @param {object} requestObject
 * @param {string} key
 */
function getKeyValue(requestObject, key) {
  const values = [];
  Object.keys(requestObject).forEach((rawKey) => {
    const k = _.camelCase(rawKey.split('.', 1)[0].toLowerCase().trim());
    if (k === key) {
      values.push({
        originalKey: rawKey,
        value: requestObject[rawKey],
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
  const { config, association, model } = handler;
  const relations = model.getRelations();
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

  // Relation keys
  Object.keys(relations || {}).forEach((key) => {
    validKeys.push(key);
    validDotKeys.push(key);
  });

  // Filter keys
  const validFilters = { self: [], relations: {} };
  if (!handler.id) {
    validFilters.self = Object.keys((handler.config.validFilters || {}));

    // Valid relation filters
    Object.keys(relations || {}).forEach((key) => {
      const relation = relations[key];
      const referrer = getNextReferrerId(handler, key);
      const relatedModel = relation.relatedModelClass;
      const relationAPIConfig = getAPIConfig(relatedModel, referrer);
      const validIncludeFilters = Object.keys(
        relationAPIConfig.validFilters || {}
      );

      if (validIncludeFilters.length) {
        validFilters.relations[key] = validIncludeFilters;
        handler.config.validRelationFilters[key] =
          relationAPIConfig.validFilters;
      }
    });

    // Enable `df` if this is an associated reference (not main entry model)
    if (
      handler.usExpressJSRequestObject
      && handler.relation
      && validFilters.self.length
    ) {
      validKeys.push('df');
      validDotKeys.push('df');
    }
    // Enable keys for all named filters on model
    else if (handler.usExpressJSRequestObject) {
      validKeys = validKeys.concat(validFilters.self);
    }
    // If it's a structured object, enable the `filters` key
    else if (
      validFilters.self.length
      || Object.keys(validFilters.relations).length
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
  const keys = Object.keys(handler.requestObject);
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

      delete handler.requestObject[key];
    }

    if (handler.validDotKeys.includes(key)) {
      const dotCount = (rawKey.match(/\./g) || []).length;
      if (dotCount < 1 && !isObject(handler.requestObject[key])) {
        handler.errors.push(
          `Invalid query parameter format: ${handler.trace}${rawKey}`
        );
      }

      delete handler.requestObject.e;
    }
  });
}


/**
 * Validate limit option
 * @param {object} requestObject
 * @param {object} handler
 */
function validateLimit(requestObject, handler) {
  const { config, trace } = handler;

  if (!config.defaultLimit) {
    throw new Error('defaultLimit is not set in apiConfig');
  }

  if (!config.maxLimit) {
    throw new Error('maxLimit is not set in apiConfig');
  }

  const queryLimit = getKeyValue(requestObject, 'limit');
  if (queryLimit) {
    const qLimit = queryLimit[0];
    let { value } = qLimit;

    // Only allow one 'limit=' for ExpressJS
    if (handler.usExpressJSRequestObject && value.length > 1) {
      handler.errors.push(
        `Invalid ${trace}${qLimit.originalKey}. ` +
        'There are multiple occurences in the url.'
      );
      value = 10;
    }
    else if (handler.usExpressJSRequestObject) {
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
        `Invalid ${trace}${qLimit.originalKey} value '${qLimit.value}'`
      );
    }
  }

  return config.defaultLimit;
}


/**
 * Validate offset option
 * @param {object} requestObject
 * @param {object} handler
 */
function validateOffset(requestObject, handler) {
  const { trace } = handler;
  const queryOffset = getKeyValue(requestObject, 'offset');

  if (queryOffset) {
    const qOffset = queryOffset[0];
    let { value } = qOffset;

    // Only allow one 'offset=' for ExpressJS
    if (handler.usExpressJSRequestObject && value.length > 1) {
      handler.errors.push(
        `Invalid ${trace}${qOffset.originalKey}. ` +
        'There are multiple occurences in the url.'
      );
      value = 0;
    }
    else if (handler.usExpressJSRequestObject) {
      ([value] = value);
    }

    if (isNumber(value)) {
      const numOffset = +value;
      if (numOffset >= 0 && numOffset <= Number.MAX_SAFE_INTEGER) {
        return numOffset;
      }
    }

    handler.errors.push(
      `Invalid ${trace}${qOffset.originalKey} value '${qOffset.value}'`
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
    const { queryOptions, requestObject } = handler;
    queryOptions.limit = validateLimit(requestObject, handler);
    queryOptions.offset = validateOffset(requestObject, handler);
  }
}


/**
 * Validates and sets database ordering from the ?order=... query parameter
 * @param {object} handler
 */
function setOrdering(handler) {
  const {
    config,
    requestObject,
    queryOptions,
    trace,
  } = handler;

  if (!config.defaultOrder) {
    throw new Error('defaultOrder is not set in apiConfig');
  }

  if (!config.validOrderFields) {
    throw new Error('validOrderFields is not set in apiConfig');
  }

  queryOptions.order = config.defaultOrder;

  if (config.ordering) {
    const queryOrder = getKeyValue(requestObject, 'order');
    if (queryOrder && queryOrder[0].value) {
      const qOrder = queryOrder[0];
      let values = qOrder.value;

      // Only allow one 'order=' for ExpressJS
      if (handler.usExpressJSRequestObject && values.length > 1) {
        handler.errors.push(
          `Invalid ${trace}${qOrder.originalKey}. ` +
          'There are multiple occurences in the url.'
        );
        return;
      }
      else if (handler.usExpressJSRequestObject) {
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
          `'${qOrder.errorReportingValue}'`
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
              `'${qOrder.errorReportingValue}'` +
              `${values.length > 1 ? ` on '${orderExpression}'.` : '. '}` +
              'The correct format is \'<field_name> asc|desc\''
            );
            valid = false;
          }
          else {
            o[0] = _.camelCase(o[0].toLowerCase().trim());
            o[1] = o[1].toLowerCase().trim();

            if (!config.validOrderFields.includes(o[0])) {
              handler.errors.push(
                `Invalid ${trace}${qOrder.originalKey} value ` +
                `'${qOrder.errorReportingValue}'` +
                `${values.length > 1 ? ` on '${orderExpression}'.` : '. '}` +
                'The field name is not a valid order field.'
              );
              valid = false;
            }
            if (o[1] !== 'asc' && o[1] !== 'desc') {
              handler.errors.push(
                `Invalid ${trace}${qOrder.originalKey} value ` +
                `'${qOrder.errorReportingValue}'` +
                `${values.length > 1 ? ` on '${orderExpression}'.` : '. '}` +
                'The order direction must be either \'asc\' or \'desc\'.'
              );
              valid = false;
            }

            order.push([o[0], o[1]]);
          }
        });

        if (valid && order.length) {
          queryOptions.order = order;
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
    requestObject,
    trace,
    model,
    relation,
  } = handler;

  const validFieldKeys = model.getBaseFields(handler.referrer);
  const validRelationKeys = Object.keys(model.relationMappings || {});

  // Relation extra fields
  if (relation && relation.joinTableExtras) {
    relation.joinTableExtras.forEach((extra) => {
      validFieldKeys.push(extra.aliasProp);
    });
  }

  // Set default fields
  handler.fields = config.defaultFields;
  handler.relationFields = validRelationKeys
    .filter((k) => (config.defaultRelations || []).includes(k));

  const queryFields = getKeyValue(requestObject, 'fields');
  if (queryFields && queryFields[0].value) {
    const qFields = queryFields[0];
    let values = qFields.value;

    // Only allow one 'fields=' for ExpressJS
    if (handler.usExpressJSRequestObject && values.length > 1) {
      handler.errors.push(
        `Invalid ${trace}${qFields.originalKey}. ` +
        'There are multiple occurences in the url.'
      );
      return;
    }
    else if (handler.usExpressJSRequestObject) {
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
        `'${qFields.errorReportingValue}'`
      );
    }
    else {
      let valid = true;
      const fields = [];
      const relationFields = [];
      values.forEach((fieldExpression) => {
        const f = _.camelCase(fieldExpression.toLowerCase().trim());
        if (
          !validFieldKeys.includes(f)
          && !validRelationKeys.includes(f)
        ) {
          handler.errors.push(
            `Invalid ${trace}${qFields.originalKey} value ` +
            `'${qFields.errorReportingValue}'` +
            `${values.length > 1 ? ` on '${fieldExpression}'. ` : '. '}` +
            'This is not a valid field.'
          );
          valid = false;
        }

        if (validRelationKeys.includes(f)) {
          relationFields.push(f);
        }
        else {
          fields.push(f);
        }
      });

      // All fields validated
      if (valid && (fields.length || relationFields.length)) {
        handler.fields = fields;
        handler.relationFields = relationFields;
      }
    }
  }
}


function setFilters(handler) {
  if (handler.id) {
    if (Array.isArray(handler.model.idColumn)) {
      throw new Error('Multi-column IDs are not supported here');
    }

    handler.queryOptions.where = {
      $and: [
        {
          whereType: 'where',
          options: [
            `[[MODEL-TABLE]].${handler.model.idColumn}`,
            '=',
            handler.id,
          ],
        },
      ],
    };
    return;
  }

  validateAndProcessFilters(handler);
}


function validateRelationKeys(handler) {
  const keys = Object.keys(handler.requestObject);
  const { model } = handler;

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

    if (Object.keys(model.relationMapping || {}).includes(key)) {
      const rawRelationKeys = rawKey.split('.');
      const rawRelationKey = rawRelationKeys[0].trim();
      let rawSubKey;

      if (rawRelationKeys.length > 1) {
        rawSubKey = rawRelationKeys.slice(1).join('.').trim();
      }

      if (
        subKey
        && subKey.length
        && !['limit', 'offset', 'order', 'df'].includes(subKey)
        && !handler.relationFields.includes(key)
        && Object.keys(handler.validFilters.relations).includes(key)
        && !handler.validFilters.relations[key].includes(subKey)
      ) {
        handler.errors.push(
          `Invalid query parameter: ${handler.trace}${rawKey}. ` +
          `'${rawSubKey}' is not a valid filter on '${rawRelationKey}'.`
        );
      }
      else if (
        !handler.relationFields.includes(key)
        && (
          !subKey
          || !subKey.length
          || ['limit', 'offset', 'order', 'df'].includes(subKey)
        )
      ) {
        handler.errors.push(
          `Invalid query parameter: ${handler.trace}${rawKey}. ` +
          `'${rawRelationKey}' is not included in fields.`
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
  const { model } = handler;

  // translate fields to attributes for fields which are not includes/extends
  const fieldsToConvert = handler.fields
    .filter((f) => !Object.keys((handler.config.include || {})).includes(f));
  handler.queryOptions.attributes = handler.model.getAPIFieldsToAttributes(
    handler.referrer, fieldsToConvert
  );

  // Make sure the primary keys are always selected
  const idColumns = Array.isArray(model.idColumn)
    ? model.idColumn
    : [model.idColumn];
  idColumns.forEach((key) => {
    if (!handler.queryOptions.attributes.includes(key)) {
      handler.queryOptions.attributes.push(key);
    }
  });

  // Make sure the fields needed for relations from this model are always
  // selected
  const relations = model.getRelations();
  Object.keys(handler.relations || {}).forEach((relationKey) => {
    const relation = relations[relationKey];
    relation.ownerProp.props.forEach((identifier) => {
      if (!handler.queryOptions.attributes.includes(identifier)) {
        handler.queryOptions.attributes.push(identifier);
      }
    });
  });

  // Make sure the fields needed for relations to this model are always
  // selected
  if (handler.relation) {
    handler.relation.relatedProp.props.forEach((identifier) => {
      if (!handler.queryOptions.attributes.includes(identifier)) {
        handler.queryOptions.attributes.push(identifier);
      }
    });
  }

  // Make sure the order by key is always selected
  (handler.queryOptions.order || []).forEach((orderKey) => {
    if (!handler.queryOptions.attributes.includes(orderKey[0])) {
      handler.queryOptions.attributes.push(orderKey[0]);
    }
  });
}


/**
 * Set list of associations to be included
 * @param {object} handler
 */
function setRelations(handler) {
  const { model } = handler;

  // Do nothing if the model api configuration does not define any
  const relations = model.getRelations();
  if (!Object.keys(relations).length) {
    return;
  }

  handler.relationFields.forEach((key) => {
    handler.relations[key] = relations[key];
  });
}


/**
 * Process current requestObject and get values defined for the extend model
 * @param {object} handler
 * @param {key} key
 */
function getRelationQueryObject(handler, key) {
  let extendQueryObject = {};
  const values = getKeyValue(handler.requestObject, key);
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
          const camelCasedSubKey = subKey
            .split('.')
            .map((k) => _.camelCase(k))
            .join('.');

          // If it's not a valid relation-filter on the current model
          if (
            !Object.keys(handler.validFilters.relations).includes(key)
            || !handler.validFilters.relations[key].includes(camelCasedSubKey)
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
 * @param {object} requestObject
 * @param {array} errors
 * @param {string} trace
 */
function getDefaultHandler(
  model,
  requestObject,
  usExpressJSRequestObject,
  errors = [],
  trace = '',
) {
  return {
    queryOptions: {},
    fields: [],
    relationFields: [],
    relations: {},
    errors,
    trace,
    model,
    requestObject,
    usExpressJSRequestObject,
  };
}


/**
 * Pick relevant keys from the handler object
 * @param {object} handler
 */
function pickFromHandlerObject(handler) {
  return {
    fields: handler.fields,
    relationFields: handler.relationFields,
    model: handler.model,
    config: handler.config,
    relations: handler.relations,
    queryOptions: handler.queryOptions,
    relation: handler.relation,
    id: handler.id,
    usExpressJSRequestObject: handler.usExpressJSRequestObject,
  };
}


/**
 * Used as a recursive function to process models and any extend-models
 * @param {string} referrer
 * @param {object} handler
 */
function processRequestParameters(referrer, handler) {
  handler.referrer = referrer;
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
  validateRelationKeys(handler);
  setRelations(handler);

  // Update queryOptions with relations and recursive request parameter
  // processing
  if (Object.keys(handler.relations).length) {
    Object.keys(handler.relations).forEach((key) => {
      const extendQueryObject = getRelationQueryObject(handler, key);

      const extendHandler = getDefaultHandler(
        handler.relations[key].relatedModelClass,
        extendQueryObject,
        handler.usExpressJSRequestObject,
        handler.errors,
        `${handler.trace}${_.snakeCase(key)}.`
      );

      const relations = handler.model.getRelations();
      extendHandler.relation = relations[key];

      const nextReferrer = getNextReferrerId(handler, key);
      processRequestParameters(nextReferrer, extendHandler);

      handler.relations[key] = {
        ...pickFromHandlerObject(extendHandler),
        id: null,
      };
    });
  }

  // Set attributes to be included in the SQL
  setAttributes(handler);
}


function convertExpressJSparamsToArrays(requestObject) {
  const res = {};
  Object.keys(requestObject).forEach((key) => {
    res[key] = Array.isArray(requestObject[key])
      ? requestObject[key]
      : [requestObject[key]];
  });
  return res;
}


/**
 * Validate and processes requestObject into request parameters used by the
 * process-request module.
 * @param {object} entrymodel The entry db.model
 * @param {object} requestObject a preconfigured nested query object or the
 *                             ExpressJS req.query object
 * @param {string} requestObject id of a single object
 */
export default function (
  entrymodel,
  requestObject,
  id = null,
  usExpressJSRequestObject = true
) {
  const qObject = usExpressJSRequestObject
    ? convertExpressJSparamsToArrays(requestObject)
    : requestObject;
  const handler = getDefaultHandler(
    entrymodel, qObject, usExpressJSRequestObject
  );
  handler.id = id;

  const referrer = id ? '*single' : '*list';
  processRequestParameters([referrer], handler);

  return [handler.errors, pickFromHandlerObject(handler)];
}

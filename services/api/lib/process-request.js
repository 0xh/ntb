import _ from 'lodash';

import db from '@turistforeningen/ntb-shared-models';
import { isNumber, isObject } from '@turistforeningen/ntb-shared-utils';
import { getSqlFromFindAll } from '@turistforeningen/ntb-shared-db-utils';

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

  // Extend key
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
  const keysWithValidDots = ['e'];

  keys.forEach((rawKey) => {
    const key = _.camelCase(rawKey.split('.', 1)[0].toLowerCase().trim());
    if (
      !handler.validKeys.includes(key)
      || (
        rawKey.includes('.')
        && !keysWithValidDots.includes(key)
      )
    ) {
      // Add errors on invalid query parameters (?queryparam)
      handler.errors.push(
        `Invalid query parameter: ${handler.trace}${rawKey}`
      );

      delete handler.queryObject[key];
    }

    if (key === 'e') {
      const dotCount = (rawKey.match(/\./g) || []).length;
      if (dotCount < 2 && !isObject(handler.queryObject.e)) {
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

  const validFieldKeys = Object.keys(config.validFields);
  const validIncludeKeys = Object.keys(config.include || {});

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
      values.forEach((fieldExpression) => {
        const f = _.camelCase(fieldExpression.toLowerCase().trim());
        if (!validFieldKeys.includes(f) && !validIncludeKeys.includes(f)) {
          handler.errors.push(
            `Invalid ${trace}${qFields.originalKey} value ` +
            `"${qFields.errorReportingValue}"` +
            `${values.length > 1 ? ` on "${fieldExpression}".` : '. '}` +
            'This is not a valid field.'
          );
          valid = false;
        }

        if (validIncludeKeys.includes(f)) {
          includeFields.push(f);
        }
        else {
          fields.push(f);
        }
      });

      // All fields validated
      if (valid && (fields.length || includeFields.length)) {
        handler.fields = fields;
        handler.includeFields = includeFields;
      }
    }
  }
}


function validateIncludeKeys(handler) {
  const keys = Object.keys(handler.queryObject);

  keys.forEach((rawKey) => {
    const key = rawKey.split('.', 1)[0].toLowerCase().trim();
    if (key === 'e') {
      let includeKeys = [];

      // String extend key
      if (rawKey.includes('.')) {
        includeKeys.push(
          rawKey.split('.')[1].trim()
        );
      }
      // Query objects
      else if (isObject(handler.queryObject)) {
        includeKeys = Object.keys((handler.queryObject.e || {}))
          .map((k) => k.trim());
      }

      includeKeys.forEach((rawIncludeKey) => {
        const includeKey = _.camelCase(rawIncludeKey.toLowerCase());
        if (!handler.config.include[includeKey]) {
          handler.errors.push(
            `Invalid query parameter: ${handler.trace}${rawKey}. ` +
            `"${rawIncludeKey}" is not a valid extend field."`
          );
        }
        else if (!handler.includeFields.includes(includeKey)) {
          handler.errors.push(
            `Invalid query parameter: ${handler.trace}${rawKey}. ` +
            `"${rawIncludeKey}" is not a included in fields."`
          );
        }
      });
    }
  });
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

  // Make sure the primary keys are always selected
  Object.keys(handler.model.primaryKeys).forEach((key) => {
    if (!handler.sequelizeOptions.attributes.includes(key)) {
      handler.sequelizeOptions.attributes.push(key);
    }
  });
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


/**
 * Get handler object with default values
 * @param {object} model
 * @param {object} queryObject
 * @param {array} errors
 * @param {string} trace
 */
function getDefaultHandler(model, queryObject, errors = [], trace = '') {
  return {
    sequelizeOptions: {},
    fields: [],
    includeFields: [],
    include: {},
    errors,
    trace,
    model,
    queryObject,
  };
}


/**
 * Pick relevant keys from the handler object
 * @param {object} handler
 */
function pickFromHandlerObject(handler) {
  return {
    fields: handler.fields,
    includeFields: handler.includeFields,
    model: handler.model,
    config: handler.config,
    include: handler.include,
    sequelizeOptions: handler.sequelizeOptions,
  };
}


/**
 * Used as a recursive function to process models and any extend-models
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
  validateIncludeKeys(handler);
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
          ...pickFromHandlerObject(extendHandler),
        };
      }
    });
  }
}


async function createIncludeSqlQuery(handler, include) {
  const originModel = handler.model;
  const { model, through } = include;
  const throughModel = originModel.associations[through.association].target;

  let sql = await getSqlFromFindAll(model, {
    ...include.sequelizeOptions,
    include: [{
      association: through.association,
      attributes: [],
    }],
  });

  // Replace existing limits and offsets
  sql = sql.replace(/LIMIT [0-9]+ OFFSET [0-9]+/g, '');

  // Replace "LEFT OUTER JOIN" WITH "INNER JOIN"
  sql = sql.replace(
    `LEFT OUTER JOIN "${throughModel.tableName}"`,
    `INNER JOIN "${throughModel.tableName}"`
  );

  // Inject WHERE clause to connect outer table with the lateral join
  const innerJoinByPos = sql.lastIndexOf(' INNER JOIN ');
  const orderByPos = sql.lastIndexOf(' ORDER BY ');
  let wherePos = sql.indexOf(' WHERE ', innerJoinByPos);
  if (wherePos === -1) {
    wherePos = null;
  }

  sql = (
    `${sql.substr(0, wherePos || orderByPos)} WHERE ` +
    `"${through.association}"."${through.foreignKey}" = "outer"."uuid" ` +
    `${wherePos ? 'AND' : ''} ${sql.substr(orderByPos)} ` +
    `LIMIT ${include.sequelizeOptions.limit} ` +
    `OFFSET ${include.sequelizeOptions.offset} `
  );

  // Add outer sql an lateral join the main sql
  sql = (
    'SELECT "outer"."uuid" AS "outerid", "Area".* ' +
    `FROM "public"."area" AS "outer", LATERAL (${sql}) AS "Area" ` +
    'WHERE "outer"."uuid" IN (?) ORDER BY "outer"."uuid"'
  );

  return sql;
}


async function executeIncludeQueries(handler, outerInstances) {
  if (!Object.keys(handler.include).length) {
    return;
  }

  await Promise.all(
    Object.keys(handler.include).map(async (key) => {
      // Create the inclide sql
      const include = handler.include[key];
      const sqlQuery = await createIncludeSqlQuery(handler, include);

      // Run the query
      const rows = await db.sequelize.query(sqlQuery, {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: [
          outerInstances.map((r) => r.uuid),
        ],
      });

      // Map the results to the include model
      const includeInstances = [];
      rows.forEach((row) => {
        // Find the main rows
        const outers = outerInstances.filter((r) => r.uuid === row.outerid);
        if (!outers) {
          throw new Error('Unable to map include.row with outer.row');
        }

        outers.forEach((outer) => {
          // Initiate include array
          if (!outer[key]) {
            outer[key] = { count: null, rows: [] };
          }

          // Append the instance
          const instance = new include.model(row);
          includeInstances.push(instance);
          outer[key].rows.push(instance);
        });
      });

      // Recursive include
      if (Object.keys(include.include).length && rows.length) {
        await executeIncludeQueries(include, includeInstances);
      }

      return Promise.resolve();
    })
  );
}


/**
 * Process the defined queries and return data
 * @param {object} handler
 */
async function executeQuery(handler) {
  const result = await handler.model.findAndCountAll(handler.sequelizeOptions);
  console.log(result.rows.map((r) => r.uuid));

  // Run any include queries
  await executeIncludeQueries(handler, result.rows);

  return result;
}


/**
 * Validate and processes queryObject into request parameters used by the
 * process-request module.
 * @param {object} entryModel The entry db.model
 * @param {object} queryObject a preconfigured nested query object or the
 *                             ExpressJS req.query object
 */
export default async function (entryModel, queryObject) {
  const handler = getDefaultHandler(entryModel, queryObject);
  processRequestParameters('*onEntry', handler);

  if (handler.errors.length) {
    throw new APIError(
      'The query is not valid',
      { apiErrors: handler.errors }
    );
  }

  const result = await executeQuery(pickFromHandlerObject(handler));

  return result;
}

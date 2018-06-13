import _ from 'lodash';
import uuidValidate from 'uuid-validate';

import { isString } from 'util';
import processStringClause from './filter-process-string-clause';


function processExpressJSQueryObjectDeepFilter(
  handler,
  rawQueryKeys,
  filters
) {
  const queryKeys = rawQueryKeys
    .filter((key) => key.startsWith('df.'))
    .map((key) => key.substr(3));

  queryKeys.forEach((rawKey) => {
    const keys = rawKey.split('.');
    const key = _.camelCase(keys[0]);
    const subKey = keys.length > 1
      ? keys.slice(1).map((k) => _.camelCase(k)).join('.')
      : null;

    if (
      (
        !handler.validFilters.self.includes(key)
        && !Object.keys(handler.validFilters.relations).includes(key)
      )
      || (
        handler.validFilters.self.includes(key)
        && subKey !== null
      )
    ) {
      handler.errors.push(
        `Invalid query parameter: ${handler.trace}df.${rawKey}. ` +
        `"${keys[0]}" is not a valid filter"`
      );
    }
    else if (
      !handler.validFilters.self.includes(key)
      && !handler.validFilters.relations[key].includes(subKey)
    ) {
      handler.errors.push(
        `Invalid query parameter: ${handler.trace}df.${rawKey}. ` +
        `"${keys.slice(1).join('.')}" is not a valid filter"`
      );
    }
    else {
      const rawQueryValue = handler.requestObject[`df.${rawKey}`];
      const rawValues = Array.isArray(rawQueryValue)
        ? rawQueryValue
        : [rawQueryValue];

      const options = subKey
        ? handler.config.validRelationFilters[key][subKey]
        : handler.config.validFilters[key];

      filters.$and = filters.$and.concat(rawValues.map((rawValue) => ({
        key: subKey || key,
        relationKey: subKey ? key : null,
        query: {
          rawValue,
          trace: `${handler.trace}df.${rawKey}`,
        },
        options,
      })));
    }
  });
}


function processExpressJSQueryObject(handler) {
  const queryKeys = Object.keys(handler.requestObject || {});
  const filters = { $and: [] };

  // If it's a relation, only parse deep-filters (df)
  if (handler.relation) {
    processExpressJSQueryObjectDeepFilter(handler, queryKeys, filters);
  }
  else {
    const validRelationFilterKeys = [];
    Object.keys(handler.validFilters.relations).forEach((relationKey) => {
      handler.validFilters.relations[relationKey].forEach((key) => {
        validRelationFilterKeys.push(
          `${_.snakeCase(relationKey)}.${_.snakeCase(key)}`
        );
      });
    });
    const validKeys = [].concat(
      handler.validFilters.self
        .map((k) => _.snakeCase(k)),
      validRelationFilterKeys
    );
    const filterKeys = validKeys.filter((k) => queryKeys.includes(k));

    filterKeys.forEach((rawKey) => {
      const rawQueryValue = handler.requestObject[rawKey];
      const rawValues = Array.isArray(rawQueryValue)
        ? rawQueryValue
        : [rawQueryValue];

      let relationKey = null;
      let key = null;
      let options = null;
      if (validRelationFilterKeys.includes(rawKey)) {
        const splittedKey = rawKey.split('.');
        relationKey = _.camelCase(splittedKey[0]);
        key = splittedKey.slice(1).map((k) => _.camelCase(k)).join('.');
        const { validRelationFilters } = handler.config;
        options = validRelationFilters[relationKey][key];
      }
      else {
        key = _.camelCase(rawKey);
        options = handler.config.validFilters[key];
      }

      filters.$and = filters.$and.concat(rawValues.map((rawValue) => ({
        key,
        relationKey,
        query: {
          rawValue,
          trace: rawKey,
        },
        options,
      })));
    });
  }

  return filters.$and.length
    ? filters
    : null;
}


function processStructuredQueryObjectFilters(
  handler,
  filters,
  operator,
  trace
) {
  const res = [];
  filters.forEach((filter, idx) => {
    if (!Array.isArray(filter) || filter.length !== 2) {
      handler.errors.push(
        `Invalid format of filter in "${trace}" at index ${idx}`
      );
    }
    else {
      const [key, value] = filter;

      if (['$and', '$or'].includes(key.toLowerCase())) {
        const newTrace = `${trace}[${idx} - ${key}]`;
        res.push(
          processStructuredQueryObjectFilters(
            handler, value, key, newTrace
          )
        );
      }
      else {
        const camelCasedKey = key
          .split('.')
          .map((k) => _.camelCase(k.toLowerCase()))
          .join('.');

        if (!camelCasedKey.includes('.')) {
          if (handler.validFilters.self.includes(camelCasedKey)) {
            res.push({
              key: camelCasedKey,
              query: {
                rawValue: value,
                trace: `${trace}[${idx} - ${key}]`,
              },
              options: handler.config.validFilters[camelCasedKey],
            });
          }
          else {
            handler.errors.push(
              `Invalid filter in "${trace}" and index ${idx}: "${filter[0]}"`
            );
          }
        }
        else {
          const keys = key.split('.');
          const relationKey = _.camelCase(keys[0].toLowerCase());
          const subKey = keys
            .slice(1)
            .map((k) => _.camelCase(k.toLowerCase()))
            .join('.');

          if (
            !Object.keys(handler.validFilters.relations).includes(relationKey)
          ) {
            handler.errors.push(
              `Unknown filter in "${trace}" at index ${idx}`,
            );
          }
          else if (
            !handler.validFilters.relations[relationKey].includes(subKey)
          ) {
            handler.errors.push(
              `Unknown filter "${key.split('.').slice(1).join('.')}" ` +
              `in "${trace}[${idx}]"`,
            );
          }
          else {
            const { validRelationFilters } = handler.config;
            res.push({
              relationKey,
              key: subKey,
              query: {
                rawValue: value,
                trace: `${trace}[${idx} - ${key}]`,
              },
              options: validRelationFilters[relationKey][subKey],
            });
          }
        }
      }
    }
  });

  return !res ? null : { [operator]: res };
}


function processStructuredQueryObject(handler) {
  const { trace, requestObject } = handler;
  const inputFilters = requestObject.filters || [];
  const baseOperator = '$and';
  let filters = null;

  // Verify that filters is an array
  if (!Array.isArray(inputFilters)) {
    handler.errors.push(`Invalid format of "${trace}filters"`);
  }
  else {
    filters = processStructuredQueryObjectFilters(
      handler,
      inputFilters,
      baseOperator,
      `${handler.trace}filters`
    );
  }

  return filters;
}


function processUuidClause(handler, filter) {
  const {
    query,
    options,
    key,
    relationKey,
  } = filter;
  let { rawValue } = query;

  const attribute = relationKey
    ? `${relationKey}.${options.attribute || key}`
    : `[[MODEL-TABLE]].${options.attribute || key}`;
  const scakeCasedAttribute = relationKey
    ? `${_.snakeCase(relationKey)}.${_.snakeCase(options.attribute || key)}`
    : `"[[MODEL-TABLE]]"."${_.snakeCase(options.attribute || key)}"`;

  rawValue = isString(rawValue) ? rawValue.trim() : rawValue;

  // Field is not null and has a value
  if (!rawValue.length) {
    return [
      {
        whereType: 'whereNotNull',
        options: [
          attribute,
        ],
      },
      {
        whereType: 'whereRaw',
        options: [
          `LENGTH(${scakeCasedAttribute}) > 0`,
        ],
      },
    ];
  }

  // Field is null or does not have a value
  if (rawValue === '!') {
    return [{
      $or: [
        {
          whereType: 'whereNull',
          options: [
            attribute,
          ],
        },
        {
          whereType: 'whereRaw',
          options: [
            `LENGTH(${scakeCasedAttribute}) = 0`,
          ],
        },
      ],
    }];
  }

  // In list of values
  // Not in list of values
  if (rawValue.startsWith('$in:') || rawValue.startsWith('$nin:')) {
    let values = rawValue;
    let err = null;
    let valid;

    if (Array.isArray(values)) {
      valid = values.map((v) => isString(v)).every((v) => v);
      if (!valid) {
        err = 1;
      }
    }
    else if (isString(values)) {
      values = rawValue.substr(rawValue.startsWith('$in:') ? 4 : 5);
      if (!values || !values.startsWith('"') || !values.endsWith('"')) {
        err = 1;
      }
      else {
        try {
          values = JSON.parse(`[${values}]`);
        }
        catch (e) {
          err = 1;
        }
      }
    }
    else {
      err = 1;
    }

    if (!err) {
      valid = values.length && values.every((v) => v.length);
      if (!valid) {
        err = 2;
      }
    }

    if (!err) {
      valid = values.length && values.every((v) => uuidValidate(v, 4));
      if (!valid) {
        err = 2;
      }
    }

    if (err === 1) {
      handler.errors.push(
        `Invalid value of '${filter.query.trace}'. ` +
        'Not able to parse a list of values.'
      );
      return [];
    }
    else if (err === 2) {
      handler.errors.push(
        `Invalid value of '${filter.query.trace}'. ` +
        'It contains invalid values.'
      );
      return [];
    }

    const whereType = rawValue.startsWith('$in:')
      ? 'whereIn'
      : 'whereNotIn';
    return [{
      whereType,
      options: [
        attribute,
        values,
      ],
    }];
  }

  // Only allow string values for the next cases
  if (!isString(rawValue)) {
    handler.errors.push(
      `Invalid value of '${filter.query.trace}'. ` +
      'Only string of uuid4 format supported.',
    );
    return [];
  }

  // Not equal
  if (rawValue.startsWith('!')) {
    const value = rawValue.substr(1).trim();

    if (!uuidValidate(value, 4)) {
      handler.errors.push(
        `Invalid value of '${filter.query.trace}'. ` +
        'Only string of uuid4 format supported.',
      );
      return [];
    }

    return [{
      whereType: 'where',
      options: [
        attribute,
        '!=',
        value,
      ],
    }];
  }

  if (!uuidValidate(rawValue, 4)) {
    handler.errors.push(
      `Invalid value of '${filter.query.trace}'. ` +
      'Only string of uuid4 format supported.',
    );
    return [];
  }

  // Exact match
  return [{
    whereType: 'where',
    options: [
      attribute,
      '=',
      rawValue,
    ],
  }];
}


function createClause(handler, filter) {
  if (!filter.relationKey) {
    const schemaProperties = handler.model.jsonSchema.properties;
    filter.type = schemaProperties[filter.key].type;
    filter.schema = schemaProperties[filter.key];
  }
  else {
    const relations = handler.model.getRelations();
    const relation = relations[filter.relationKey];
    const schemaProperties = relation.relatedModelClass.jsonSchema.properties;
    filter.type = schemaProperties[filter.key].type;
    filter.schema = schemaProperties[filter.key];

    // Include association
    const { queryOptions } = handler;
    if (!queryOptions.relations) {
      queryOptions.relations = [];
    }

    const found = !!queryOptions.relations
      .map((i) => i.relationKey)
      .filter((n) => n === filter.relationKey)
      .length;

    if (!found) {
      queryOptions.relations.push({
        relationKey: filter.relationKey,
      });
    }
  }

  // Uuid clause
  if (
    filter.type === 'string'
    && filter.schema
    && filter.schema.format === 'uuid'
  ) {
    return processUuidClause(handler, filter);
  }

  // Plain string clause with no format
  if (filter.type === 'string' && (!filter.schema || !filter.schema.format)) {
    return processStringClause(handler, filter);
  }

  throw new Error('NOT IMPLEMENTED YET');
}


function createWhereOptions(handler, filters) {
  const operator = filters.$and ? '$and' : '$or';
  let clauses = [];

  (filters.$and || filters.$or).forEach((filter) => {
    if (filter.$and || filter.$or) {
      clauses = clauses.concat(createWhereOptions(handler, filter));
    }
    else {
      clauses = clauses.concat(createClause(handler, filter));
    }
  });

  const where = { [operator]: clauses };
  return where;
}


export default function (handler) {
  let filters = {};
  if (handler.usExpressJSRequestObject) {
    filters = processExpressJSQueryObject(handler);
  }
  else {
    filters = processStructuredQueryObject(handler);
  }

  if (filters) {
    const where = createWhereOptions(handler, filters);
    handler.queryOptions = {
      ...handler.queryOptions,
      where: {
        ...handler.queryOptions.where,
        ...where,
      },
    };
  }
}

import _ from 'lodash';

import processStringClause from './filter-string';
import processUuidClause from './filter-uuid';
import processBooleanClause from './filter-boolean';
import processDatetimeClause from './filter-datetime';
import processRelationExistanceClause from './filter-relation-existance';
import processNumberClause from './filter-number';


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
      && subKey
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

      let filterKey = subKey || key;
      let relationKey = subKey ? key : null;
      if (
        !handler.validFilters.self.includes(key)
        && Object.keys(handler.validFilters.relations).includes(key)
      ) {
        filterKey = '';
        relationKey = key;
      }

      filters.$and = filters.$and.concat(rawValues.map((rawValue) => ({
        key: filterKey,
        relationKey,
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
      validRelationFilterKeys.push(
        `${_.snakeCase(relationKey)}`
      );

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


function createClause(handler, filter) {
  // Join filter
  if (Object.keys(handler.validFilters.join).includes(filter.key)) {
    const props = handler.relation.joinModelClass.validFilters[filter.key];
    filter.isJoinFilter = true;
    filter.type = props.type;
    filter.options = props.options;
  }
  // Self filter
  else if (!filter.relationKey) {
    const schemaProperties = handler.model.jsonSchema.properties;
    filter.type = schemaProperties[filter.key].type;
    filter.schema = schemaProperties[filter.key];
  }
  // Relation filter
  else {
    const relations = handler.model.getRelations();
    const relation = relations[filter.relationKey];

    // If it's a filter on a relations attribute
    if (filter.key) {
      const schemaProps = relation.relatedModelClass.jsonSchema.properties;
      filter.type = schemaProps[filter.key].type;
      filter.schema = schemaProps[filter.key];
    }
    // If it's a filter on whether the relation exists
    else {
      if (Array.isArray(relation.relatedModelClass.idColumn)) {
        throw new Error('Multi primarykey tables not supported here');
      }

      filter.key = relation.relatedModelClass.idColumn;
      filter.relationExistance = true;
      filter.options = {};
    }

    // Include relations
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
        joinType: 'leftJoin',
      });
    }
  }

  const {
    isJoinFilter,
    relationKey,
    options,
    key,
  } = filter;

  // Relation filter
  if (relationKey) {
    filter.attribute = `${relationKey}.${options.attribute || key}`;
    filter.snakeCasedAttribute =
      `${_.snakeCase(relationKey)}.${_.snakeCase(options.attribute || key)}`;
  }
  else {
    // Join or self filter
    const tbl = isJoinFilter ? 'JOIN-TABLE' : 'MODEL-TABLE';
    filter.attribute = `[[${tbl}]].${options.attribute || key}`;
    filter.snakeCasedAttribute =
      `"[[${tbl}]]"."${_.snakeCase(options.attribute || key)}"`;
  }

  // Relation existance
  if (filter.relationExistance) {
    return processRelationExistanceClause(handler, filter);
  }

  // Uuid clause
  if (
    filter.type === 'string'
    && filter.schema
    && filter.schema.format === 'uuid'
  ) {
    return processUuidClause(handler, filter);
  }

  // Datetime clause
  if (
    filter.type === 'string'
    && filter.schema
    && filter.schema.format === 'date'
  ) {
    return processDatetimeClause(handler, filter);
  }

  // Boolean clause
  if (filter.type === 'boolean') {
    return processBooleanClause(handler, filter);
  }

  // Number clause
  if (filter.type === 'number') {
    return processNumberClause(handler, filter);
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

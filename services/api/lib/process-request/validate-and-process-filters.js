import _ from 'lodash';


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
      !handler.validFilters.self.includes(key)
      && !Object.keys(handler.validFilters.includes).includes(key)
    ) {
      handler.errors.push(
        `Invalid query parameter: ${handler.trace}df.${rawKey}. ` +
        `"${keys[0]}" is not a valid filter"`
      );
    }
    else if (
      !handler.validFilters.self.includes(key)
      && !handler.validFilters.includes[key].includes(subKey)
    ) {
      handler.errors.push(
        `Invalid query parameter: ${handler.trace}df.${rawKey}. ` +
        `"${keys.slice(1).join('.')}" is not a valid filter"`
      );
    }
    else {
      const rawQueryValue = handler.queryObject[`df.${rawKey}`];
      const rawValues = Array.isArray(rawQueryValue)
        ? rawQueryValue
        : [rawQueryValue];

      filters.$and = filters.$and.concat(rawValues.map((rawValue) => ({
        includeKey: subKey ? key : null,
        key: subKey || key,
        rawValue,
        trace: `${handler.trace}df.${rawKey}`,
      })));
    }
  });
}


function processExpressJSQueryObject(handler) {
  const queryKeys = Object.keys(handler.queryObject || {});
  const filters = { $and: [] };

  // If it's an association, only parse deep-filters (df)
  if (handler.association) {
    processExpressJSQueryObjectDeepFilter(handler, queryKeys, filters);
  }
  else {
    const filterKeys = Object.keys(handler.config.validFilters || {})
      .filter((k) => queryKeys.includes(k));

    filterKeys.forEach((key) => {
      const rawQueryValue = handler.queryObject[key];
      const rawValues = Array.isArray(rawQueryValue)
        ? rawQueryValue
        : [rawQueryValue];

      filters.$and = filters.$and.concat(rawValues.map((rawValue) => ({
        key,
        rawValue,
        trace: key,
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
              rawValue: value,
              trace: `${trace}[${idx} - ${key}]`,
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
          const includeKey = keys[0];
          const subKey = keys
            .slice(1)
            .map((k) => _.camelCase(k.toLowerCase()))
            .join('.');

          if (
            !Object.keys(handler.validFilters.includes).includes(includeKey)
          ) {
            handler.errors.push(
              `Unknown filter in "${trace}" at index ${idx}`,
            );
          }
          else if (
            !handler.validFilters.includes[includeKey].includes(subKey)
          ) {
            handler.errors.push(
              `Unknown filter "${key.split('.').slice(1).join('.')}" ` +
              `in "${trace}[${idx}]"`,
            );
          }
          else {
            res.push({
              includeKey,
              key: subKey,
              rawValue: value,
              trace: `${trace}[${idx} - ${key}]`,
            });
          }
        }
      }
    }
  });

  return { [operator]: res };
}


function processStructuredQueryObject(handler) {
  const { trace, queryObject } = handler;
  const inputFilters = queryObject.filters || [];
  let baseOperator = '$and';
  let filters = null;

  // Verify that filters is an array
  if (!Array.isArray(inputFilters)) {
    handler.errors.push(`Invalid format of "${trace}filters"`);
  }
  else {
    // Change to $or base operator
    if (
      inputFilters.length === 1
      && Array.isArray(inputFilters[0])
      && inputFilters[0].length > 1
      && inputFilters[0][0] === '$or'
    ) {
      baseOperator = '$or';
    }

    filters = processStructuredQueryObjectFilters(
      handler,
      inputFilters,
      baseOperator,
      `${handler.trace}filters`
    );
  }

  return filters;
}


function processTextClause(handler, filter) {
  const { rawValue, clauseKey } = filter;

  // Contains
  if (rawValue.startsWith('~')) {
    return {
      [clauseKey]: {
        [Op.iLike]: `%${rawValue.substr(1)}%`,
      },
    };
  }

  // Starts with
  if (rawValue.startsWith('^')) {
    return {
      [clauseKey]: {
        [Op.iLike]: `%${rawValue.substr(1)}`,
      },
    };
  }

  // Ends with
  if (rawValue.startsWith('$')) {
    return {
      [clauseKey]: {
        [Op.iLike]: `${rawValue.substr(1)}%`,
      },
    };
  }

  // Exact match
  return {
    [clauseKey]: {
      [Op.iLike]: rawValue,
    },
  };
}


function createClause(handler, filter) {
  if (!filter.includeKey) {
    filter.type = handler.model.attributes[filter.key].type;
    filter.clauseKey = filter.key;
  }
  else {
    const associationName =
      handler.config.include[filter.includeKey].association;
    const { target } = handler.model.associations[associationName];
    filter.type = target.attributes[filter.key].type;
    filter.clauseKey = `$${associationName}.${filter.key}$`;

    // Include association
    const { sequelizeOptions } = handler;
    if (!sequelizeOptions.include) {
      sequelizeOptions.include = [];
    }

    const found = !!sequelizeOptions.include
      .map((i) => i.association)
      .filter((n) => n === associationName)
      .length;

    if (!found) {
      sequelizeOptions.include.push({
        association: associationName,
        attributes: [],
      });
    }
  }

  if (filter.type instanceof TEXT) {
    return processTextClause(handler, filter);
  }

  throw new Error('NOT IMPLEMENTED YET');
}


function createWhereOptions(handler, filters) {
  const operator = filters.$and ? Op.and : Op.or;
  const clauses = [];

  (filters.$and || filters.$or).forEach((filter) => {
    if (filter.$and || filter.$or) {
      // TODO(Roar): recursive call to createWehereOptions()
    }
    else {
      clauses.push(createClause(handler, filter));
    }
  });

  const where = { [operator]: clauses };
  return where;
}


export default function (handler) {
  let filters = {};
  if (handler.usExpressJSQueryObject) {
    filters = processExpressJSQueryObject(handler);
  }
  else {
    filters = processStructuredQueryObject(handler);
  }

  if (filters) {
    const where = createWhereOptions(handler, filters);
    handler.sequelizeOptions = {
      ...handler.sequelizeOptions,
      where: {
        ...handler.sequelizeOptions.where,
        ...where,
      },
    };
    console.log('end');
  }
}

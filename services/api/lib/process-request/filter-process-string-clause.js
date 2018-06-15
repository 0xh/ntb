import { isString } from 'util';


function whereNotNull(handler, filter) {
  const { options } = filter;
  const { filterTypes } = options;

  if (filterTypes && !filterTypes.includes('notnull')) {
    handler.errors.push(
      `Invalid value of '${filter.query.trace}'. not-null-filter is not ` +
      'supported on this field.',
    );
    return [];
  }

  return [
    {
      whereType: 'whereNotNull',
      options: [
        filter.attribute,
      ],
    },
    {
      whereType: 'whereRaw',
      options: [
        `LENGTH(${filter.snakeCasedAttribute}) > 0`,
      ],
    },
  ];
}


function whereNull(handler, filter) {
  const { options } = filter;
  const { filterTypes } = options;

  if (filterTypes && !filterTypes.includes('notnull')) {
    handler.errors.push(
      `Invalid value of '${filter.query.trace}'. null-filter is not ` +
      'supported on this field.',
    );
    return [];
  }

  return [{
    $or: [
      {
        whereType: 'whereNull',
        options: [
          filter.attribute,
        ],
      },
      {
        whereType: 'whereRaw',
        options: [
          `LENGTH(${filter.snakeCasedAttribute}) = 0`,
        ],
      },
    ],
  }];
}


function listOfValues(handler, filter, rawValue) {
  const { options } = filter;
  const { filterTypes } = options;

  const prefix = rawValue.startsWith('$in:')
    ? '$in'
    : '$nin';
  if (filterTypes && !filterTypes.includes(prefix)) {
    handler.errors.push(
      `Invalid value of '${filter.query.trace}'. ${prefix}-filter is not ` +
      'supported on this field.',
    );
    return [];
  }

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
    values = rawValue.substr(prefix === '$in' ? 4 : 5);
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

  const whereType = prefix === '$in'
    ? 'whereIn'
    : 'whereNotIn';
  return [{
    whereType,
    options: [
      filter.attribute,
      values,
    ],
  }];
}


export default function (handler, filter) {
  const { query, options } = filter;
  let { rawValue } = query;
  const { filterTypes } = options;

  rawValue = isString(rawValue) ? rawValue.trim() : rawValue;

  // Field is not null and has a value without length
  if (rawValue !== null && !rawValue.length) {
    return whereNotNull(handler, filter);
  }

  // Field is null or does not have a value
  if (rawValue === '!') {
    return whereNull(handler, filter);
  }

  // In list of values
  // Not in list of values
  if (rawValue.startsWith('$in:') || rawValue.startsWith('$nin:')) {
    return listOfValues(handler, filter, rawValue);
  }

  // Only allow string values for the next cases
  if (!isString(rawValue)) {
    handler.errors.push(
      `Invalid value of '${filter.query.trace}'. Only string supported.`,
    );
    return [];
  }

  let value = rawValue.substr(1).trim();
  const prefix = rawValue.substr(0, 1);
  if (['~', '^', '$', '!'].includes(prefix)) {
    if (filterTypes && !filterTypes.includes(prefix)) {
      handler.errors.push(
        `Invalid value of '${filter.query.trace}'. ${prefix}-filter is not ` +
        'supported on this field.',
      );
      return [];
    }

    value = rawValue.substr(1).trim();
    if (!value.length) {
      handler.errors.push(
        `Invalid value of '${filter.query.trace}'. ` +
        'Extected a value after the operator.'
      );
      return [];
    }
  }

  // Contains
  if (prefix === '~') {
    return [{
      whereType: 'where',
      options: [
        filter.attribute,
        'ilike',
        `%${value}%`,
      ],
    }];
  }

  // Starts with
  if (prefix === '^') {
    return [{
      whereType: 'where',
      options: [
        filter.attribute,
        'ilike',
        `${value}%`,
      ],
    }];
  }

  // Ends with
  if (prefix === '$') {
    return [{
      whereType: 'where',
      options: [
        filter.attribute,
        'ilike',
        `%${value}`,
      ],
    }];
  }

  // Not equal
  if (prefix === '!') {
    return [{
      whereType: 'where',
      options: [
        filter.attribute,
        'not ilike',
        `%${value}`,
      ],
    }];
  }

  // Exact match
  return [{
    whereType: 'where',
    options: [
      filter.attribute,
      '=',
      `${rawValue.trim()}`,
    ],
  }];
}

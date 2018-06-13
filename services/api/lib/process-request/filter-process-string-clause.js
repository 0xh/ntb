import _ from 'lodash';

import { isString } from 'util';


function whereNotNull(attribute, snakeCasedAttribute) {
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
        `LENGTH(${snakeCasedAttribute}) > 0`,
      ],
    },
  ];
}


function whereNull(attribute, snakeCasedAttribute) {
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
          `LENGTH(${snakeCasedAttribute}) = 0`,
        ],
      },
    ],
  }];
}


function listOfValues(handler, filter, attribute, rawValue) {
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


export default function (handler, filter) {
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
  const snakeCasedAttribute = relationKey
    ? `${_.snakeCase(relationKey)}.${_.snakeCase(options.attribute || key)}`
    : `"[[MODEL-TABLE]]"."${_.snakeCase(options.attribute || key)}"`;

  rawValue = isString(rawValue) ? rawValue.trim() : rawValue;

  // Field is not null and has a value without length
  if (!rawValue.length) {
    return whereNotNull(attribute, snakeCasedAttribute);
  }

  // Field is null or does not have a value
  if (rawValue === '!') {
    return whereNull(attribute, snakeCasedAttribute);
  }

  // In list of values
  // Not in list of values
  if (rawValue.startsWith('$in:') || rawValue.startsWith('$nin:')) {
    return listOfValues(handler, filter, attribute, rawValue);
  }

  // Only allow string values for the next cases
  if (!isString(rawValue)) {
    handler.errors.push(
      `Invalid value of '${filter.query.trace}'. Only string supported.`,
    );
    return [];
  }

  let value = rawValue.substr(1).trim();
  if (['~', '^', '$', '!'].includes(rawValue.substr(0, 1))) {
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
  if (rawValue.startsWith('~')) {
    return [{
      whereType: 'where',
      options: [
        attribute,
        'ilike',
        `%${value}%`,
      ],
    }];
  }

  // Starts with
  if (rawValue.startsWith('^')) {
    return [{
      whereType: 'where',
      options: [
        attribute,
        'ilike',
        `${value}%`,
      ],
    }];
  }

  // Ends with
  if (rawValue.startsWith('$')) {
    return [{
      whereType: 'where',
      options: [
        attribute,
        'ilike',
        `%${value}`,
      ],
    }];
  }

  // Not equal
  if (rawValue.startsWith('!')) {
    return [{
      whereType: 'where',
      options: [
        attribute,
        'not ilike',
        `%${value}`,
      ],
    }];
  }

  // Exact match
  return [{
    whereType: 'where',
    options: [
      attribute,
      '=',
      `${rawValue.trim()}`,
    ],
  }];
}

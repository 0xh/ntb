import uuidValidate from 'uuid-validate';

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

  // Make sure each value is an uuid
  let uuidValidateErr = false;
  values.forEach((v) => {
    if (!uuidValidateErr && !uuidValidate(v, 4)) {
      uuidValidateErr = true;
    }
  });

  if (uuidValidateErr) {
    handler.errors.push(
      `Invalid value of '${filter.query.trace}'. ` +
      'Only string of uuid4 format supported.',
    );
    return [];
  }

  // Create where clause
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

  // Only allow string values
  if (!isString(rawValue)) {
    handler.errors.push(
      `Invalid value of '${filter.query.trace}'. ` +
      'Only string of uuid4 format supported.',
    );
    return [];
  }

  rawValue = rawValue.trim();

  // Field has a value with no length (NOT NULL)
  if (!rawValue.length) {
    return whereNotNull(handler, filter);
  }

  // Field is a ! (NULL)
  if (rawValue === '!') {
    return whereNull(handler, filter);
  }

  // In list of values
  // Not in list of values
  if (rawValue.startsWith('$in:') || rawValue.startsWith('$nin:')) {
    return listOfValues(handler, filter, rawValue);
  }

  // Not equal
  if (rawValue.startsWith('!')) {
    if (filterTypes && !filterTypes.includes('!')) {
      handler.errors.push(
        `Invalid value of '${filter.query.trace}'. !-filter is not ` +
        'supported on this field.',
      );
      return [];
    }

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
        filter.attribute,
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
      filter.attribute,
      '=',
      rawValue,
    ],
  }];
}

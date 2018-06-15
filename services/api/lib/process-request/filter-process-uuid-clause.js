import _ from 'lodash';
import uuidValidate from 'uuid-validate';

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


function listOfValues(handler, filter, rawValue) {
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
  const whereType = rawValue.startsWith('$in:')
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
  const { query } = filter;
  let { rawValue } = query;

  rawValue = isString(rawValue) ? rawValue.trim() : rawValue;

  // Field is not null and has a value
  if (!rawValue.length) {
    return whereNotNull(filter.attribute, filter.snakeCasedAttribute);
  }

  // Field is null or does not have a value
  if (rawValue === '!') {
    return whereNull(filter.attribute, filter.snakeCasedAttribute);
  }

  // In list of values
  // Not in list of values
  if (rawValue.startsWith('$in:') || rawValue.startsWith('$nin:')) {
    return listOfValues(handler, filter, rawValue);
  }

  // Only allow string values for the next cases
  if (!isString(rawValue)) {
    handler.errors.push(
      `Invalid value of '${filter.query.trace}'. ` +
      'Only string of uuid4 format supported.',
    );
    return [];
  }


  if (!uuidValidate(rawValue, 4)) {
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
        filter.attribute,
        '!=',
        value,
      ],
    }];
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

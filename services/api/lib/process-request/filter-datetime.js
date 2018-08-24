import moment from 'moment';

import { isString } from '@turistforeningen/ntb-shared-utils';


export default function (handler, filter) {
  const { query } = filter;
  let { rawValue } = query;

  // Only allow string values
  if (!isString(rawValue)) {
    handler.errors.push(
      `Invalid value of '${filter.query.trace}'. Invalid format`
    );
    return [];
  }


  rawValue = isString(rawValue) ? rawValue.trim().toLowerCase() : rawValue;
  let prefix = null;

  // Set prefix
  ['$after:', '$between:', '$before:'].forEach((p) => {
    if (rawValue.startsWith(p)) {
      prefix = p;
    }
  });

  // Split dates
  rawValue = rawValue.substr(prefix.length).split('|');

  // No prefix found
  if (isString(rawValue)) {
    rawValue = [rawValue];
  }

  // Validate values length
  if (
    (rawValue.length !== 1 && prefix !== '$between:')
    || (rawValue.length !== 2 && prefix === '$between:')
  ) {
    handler.errors.push(
      `Invalid value of '${filter.query.trace}'. Invalid format.`
    );
    return [];
  }

  const date1 = moment(rawValue[0].toUpperCase(), moment.ISO_8601);
  const date2 = rawValue.length === 2
    ? moment(rawValue[1].toUpperCase(), moment.ISO_8601)
    : null;

  // Validate dates
  if (!date1.isValid() || (date2 && !date2.isValid())) {
    handler.errors.push(
      `Invalid value of '${filter.query.trace}'. Invalid date format. ` +
      'Must be ISO 8601 formatted date.'
    );
  }

  // $before:
  if (prefix === '$before:') {
    return [{
      whereType: 'where',
      options: [
        filter.attribute,
        '<',
        date1,
      ],
    }];
  }

  // $after:
  if (prefix === '$after:') {
    return [{
      whereType: 'where',
      options: [
        filter.attribute,
        '>',
        date1,
      ],
    }];
  }

  // $between:
  if (prefix === '$between:') {
    return [{
      whereType: 'whereBetween',
      options: [
        filter.attribute,
        [date1, date2],
      ],
    }];
  }

  // Exact match
  return [{
    whereType: 'where',
    options: [
      filter.attribute,
      '=',
      date1,
    ],
  }];
}

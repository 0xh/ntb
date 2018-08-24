import { isString } from '@turistforeningen/ntb-shared-utils';


export default function (handler, filter) {
  const { query } = filter;
  let { rawValue } = query;

  rawValue = isString(rawValue) ? rawValue.trim().toLowerCase() : rawValue;
  let value = null;

  if (isString(rawValue) && ['true', 'false'].includes(rawValue)) {
    value = rawValue === 'true';
  }
  else if (rawValue === true || rawValue === false) {
    value = rawValue;
  }


  if (value === null) {
    handler.errors.push(
      `Invalid value of '${filter.query.trace}'. ` +
      'Value must be true/false.',
    );
    return [];
  }

  // Exact match
  return [{
    whereType: 'where',
    options: [
      filter.attribute,
      '=',
      value,
    ],
  }];
}

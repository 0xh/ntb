import { isString, isNumber } from '@ntb/shared-utils';


export default function (handler, filter) {
  const { query, options } = filter;
  const { filterTypes } = options;
  let { rawValue } = query;

  let prefix = '=';
  let value = rawValue;

  if (isString(rawValue)) {
    rawValue = rawValue.trim();
    value = rawValue;

    if (filterTypes.includes('>=') && rawValue.startsWith('>=')) {
      value = rawValue.substr(2);
      prefix = '>=';
    }
    else if (filterTypes.includes('<=') && rawValue.startsWith('<=')) {
      value = rawValue.substr(2);
      prefix = '<=';
    }
    else if (filterTypes.includes('>') && rawValue.startsWith('>')) {
      value = rawValue.substr(1);
      prefix = '>';
    }
    else if (filterTypes.includes('<') && rawValue.startsWith('<')) {
      value = rawValue.substr(1);
      prefix = '<';
    }
  }

  if (!isNumber(value)) {
    handler.errors.push(
      `Invalid value of '${filter.query.trace}'. Only integers supported.`,
    );
    return [];
  }
  value = +value;

  // Exact match
  return [{
    whereType: 'where',
    options: [
      filter.attribute,
      prefix,
      value,
    ],
  }];
}

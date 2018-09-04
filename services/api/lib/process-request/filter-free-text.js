import { isString } from '@turistforeningen/ntb-shared-utils';


export default function (handler, filter) {
  const { query } = filter;
  let { rawValue } = query;

  if (!isString(rawValue)) {
    handler.errors.push(
      `Invalid value of '${filter.query.trace}'. ` +
      'Value must be a string.',
    );
    return [];
  }

  rawValue = rawValue.trim().toLowerCase();

  if (!rawValue.length) {
    return [];
  }

  // Exact match
  return [{
    whereType: 'whereRaw',
    options: [
      `${filter.snakeCasedAttribute} @@ to_tsquery('norwegian', ?)`,
      [rawValue],
    ],
  }];
}

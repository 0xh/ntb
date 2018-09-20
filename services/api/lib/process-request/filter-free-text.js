import { isString } from '@ntb/utils';


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

  // Add phrase to join
  if (!handler.queryOptions.freeTextJoin) {
    handler.queryOptions.freeTextJoin = [];
  }
  const name = `free_text_phrase_${handler.queryOptions.freeTextJoin.length}`;
  handler.queryOptions.freeTextJoin.push([
    `JOIN plainto_tsquery('norwegian', ?) AS ${name} ON TRUE`,
    [rawValue],
  ]);

  // Exact match
  return [{
    whereType: 'whereRaw',
    options: [
      `${filter.snakeCasedAttribute} @@ ${name}`,
    ],
  }];
}

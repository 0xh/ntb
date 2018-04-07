import {
  isNumber,
} from '@turistforeningen/ntb-shared-utils';


/**
 * Validate limit option
 * @param {object} query
 */
export function validateLimit(query) {
  if (isNumber(query.limit)) {
    const limit = +query.limit;
    if (limit > 0 && limit <= 50) {
      return limit;
    }
    else if (query.limit) {
      throw new Error('Invalid limit parameter');
    }
  }
  else if (query.limit) {
    throw new Error('Invalid limit parameter');
  }

  return 10;
}

/**
 * Validate offset option
 * @param {object} query
 */
export function validateOffset(query) {
  if (query.offset === undefined) {
    return 0;
  }

  const offset = +query.offset;
  if (offset >= 0 && offset <= Number.MAX_SAFE_INTEGER) {
    return offset;
  }

  throw new Error('Invalid offset parameter');
}

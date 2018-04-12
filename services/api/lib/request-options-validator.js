import { isNumber } from '@turistforeningen/ntb-shared-utils';


/**
 * Validate limit option
 * @param {object} requestOptions
 */
export function validateLimit(requestOptions) {
  if (isNumber(requestOptions.limit)) {
    const limit = +requestOptions.limit;
    if (limit > 0 && limit <= 50) {
      return limit;
    }
    else if (requestOptions.limit) {
      throw new Error('Invalid limit parameter');
    }
  }
  else if (requestOptions.limit) {
    throw new Error('Invalid limit parameter');
  }

  return 10;
}

/**
 * Validate offset option
 * @param {object} requestOptions
 */
export function validateOffset(requestOptions) {
  if (requestOptions.offset === undefined) {
    return 0;
  }

  const offset = +requestOptions.offset;
  if (offset >= 0 && offset <= Number.MAX_SAFE_INTEGER) {
    return offset;
  }

  throw new Error('Invalid offset parameter');
}

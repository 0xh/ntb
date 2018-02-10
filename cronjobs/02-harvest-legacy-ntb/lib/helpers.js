export function isString(value) {
  return typeof value === 'string' || value instanceof String;
}


export function isNumber(value) {
  const regex = /^\d+$/g;
  return typeof value === 'number' && Number.isFinite(value)
    ? true
    : regex.test(value);
}


export function isDate(value) {
  return isNumber(Date.parse(value));
}


export function isBoolean(value) {
  return typeof value === 'boolean';
}


export function isObject(value) {
  return value && typeof value === 'object' && value.constructor === Object;
}

export function isString(value) {
  let v = value;

  // Handle MongoDB relation
  if (typeof value === 'object' && value._bsontype === 'ObjectID') {
    v = value.toString();
  }

  return typeof v === 'string' || v instanceof String;
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

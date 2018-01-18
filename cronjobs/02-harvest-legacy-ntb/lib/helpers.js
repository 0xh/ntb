'use strict';


const isString = (value) =>
  typeof value === 'string' || value instanceof String;


const isNumber = (value) => {
  const regex = /^\d+$/g;
  return typeof value === 'number' && Number.isFinite(value)
    ? true
    : regex.test(value);
};


const isDate = (value) =>
  isNumber(Date.parse(value));


const isBoolean = (value) =>
  typeof value === 'boolean';


const isObject = (value) =>
  value && typeof value === 'object' && value.constructor === Object;


module.exports = {
  isString,
  isNumber,
  isDate,
  isBoolean,
  isObject,
};

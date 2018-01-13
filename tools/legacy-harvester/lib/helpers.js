'use strict';


const getRandomIndexes = (totalCount, randomCount) => {
  const indexes = [];
  for (let i = 0; i < totalCount; i += 1) {
    indexes.push(i);
  }

  const randomIndexes = [];
  for (let y = 0; y < randomCount; y += 1) {
    randomIndexes.push(
      indexes.splice(Math.floor(Math.random() * indexes.length), 1)[0]
    );
  }

  return randomIndexes;
};


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
  getRandomIndexes,
  isString,
  isNumber,
  isDate,
  isBoolean,
  isObject,
};

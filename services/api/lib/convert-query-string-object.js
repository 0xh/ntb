import _ from 'lodash';


function setCorrectQueryStringParameterFormat(key, value) {
  if (key === 'fields') {
    return value
      .split(',')
      .map((v) => _.camelCase(v.trim().toLowerCase()))
      .filter((v) => v);
  }
  else if (key === 'order') {
    if (!value) {
      return null;
    }
    return value
      .split(',')
      .map((o) => o.split(' ', 2).concat(['']))
      .map((o) => [
        _.camelCase(o[0].trim().toLowerCase()),
        o[1].trim().toLowerCase(),
      ]);
  }
  return value;
}


/**
 * Convert an ExpressJS req.query object to a queryObject
 * @param {object} queryStringObject ExpressJS req.query object
 */
export default function (queryStringObject) {
  const queryObject = {};

  Object.keys((queryStringObject || {}))
    // camelCase from snake case
    .map((queryKey) => (
      queryKey
        .split('.')
        .map((k) => _.camelCase(k.toLowerCase()))
        .join('.')
    ))
    .forEach((queryKey) => {
      if (queryKey.includes('.')) {
        const keys = queryKey.split('.');

        let ref = queryObject;
        keys.forEach((key, idx) => {
          if (ref[key] === undefined && idx < keys.length - 1) {
            ref[key] = {};
          }
          else if (idx === keys.length - 1) {
            ref[key] = setCorrectQueryStringParameterFormat(
              key,
              queryStringObject[queryKey]
            );
          }
          ref = ref[key];
        });
      }
      else {
        queryObject[queryKey] = setCorrectQueryStringParameterFormat(
          queryKey,
          queryStringObject[queryKey]
        );
      }
    });

  return queryObject;
}

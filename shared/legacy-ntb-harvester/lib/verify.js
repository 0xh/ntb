import { validateGeojson } from '@ntb/shared-gis-utils';

import * as helpers from './helpers';


export default function verify(
  obj,
  id,
  legacyStructure,
  log = {},
  path = ''
) {
  let verified = true;
  if (log.verified === undefined) {
    log.verified = true;
    log.errors = [];
  }
  const arrayTypes = ['array-strings', 'array-numbers'];

  Object.keys(obj).forEach((key) => {
    const value = obj[key];

    if (value !== undefined && value !== null) {
      const type = legacyStructure[key];
      let isValid = true;

      // If key does not exist in defined legacy structure
      if (!type) {
        isValid = false;
      }
      // ignore type checking
      else if (type === 'ignore') {
        isValid = true;
      }
      // if object type
      else if (helpers.isObject(type)) {
        // if object type but value is not an object
        if (!helpers.isObject(value)) {
          isValid = false;
        }
        // verify nested object
        else {
          const p = `${path ? `${path}.` : ''}${key}`;
          isValid = verify(value, id, type, log, p);
        }
      }
      // Array of objects
      else if (Array.isArray(type)) {
        // if array of objects type but value is not an array
        if (!Array.isArray(value)) {
          isValid = false;
        }
        // verify nested object
        else {
          const p = `${path ? `${path}.` : ''}${key}`;
          value.forEach((v) => {
            if (!verify(v, id, type[0], log, p)) {
              isValid = false;
            }
          });
        }
      }
      // if string type does not match
      else if (type === 'string' && !helpers.isString(value)) {
        isValid = false;
      }
      // if number type does not match
      else if (type === 'number' && !helpers.isNumber(value)) {
        isValid = false;
      }
      // if date type but not able to parse as date
      else if (type === 'date' && !helpers.isDate(value)) {
        isValid = false;
      }
      // if boolean type but type does not match
      else if (type === 'boolean' && !helpers.isBoolean(value)) {
        isValid = false;
      }
      // if array type but not an array
      else if (arrayTypes.indexOf(type) !== -1 && !Array.isArray(value)) {
        isValid = false;
      }
      // if array of strings
      else if (type === 'array-strings') {
        value.forEach((v) => {
          if (!helpers.isString(v)) {
            // if array of strings but a value is not a string
            isValid = false;
          }
        });
      }
      // if array of numbers
      else if (type === 'array-numbers') {
        value.forEach((v) => {
          if (!helpers.isNumber(v)) {
            // if array of numbers but a value is not a string
            isValid = false;
          }
        });
      }
      // verify GeoJson data
      else if (type === 'geojson') {
        const [valid, errs] = validateGeojson(value);
        if (!valid) {
          isValid = false;
          log.errors.push(
            `GeoJSON error on ID: ${id} - ${errs}`
          );
        }
      }

      // Log if not valid
      if (!isValid) {
        verified = false;
        log.errors.push(
          `Structure error on ID: ${id} - ` +
          `path: ${path || 'root'} - key: ${key}`
        );
      }
    }
  });

  if (!verified) {
    log.verified = verified;
  }

  return log;
}

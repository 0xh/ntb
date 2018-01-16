'use strict';

const querystring = require('querystring');
const PQueue = require('p-queue');
const fetch = require('isomorphic-fetch');
const now = require('performance-now');
const GJV = require('geojson-validation');

const settings = require('./settings');
const helpers = require('../lib/helpers');


const createUrl = (path, id = null, options = {}) =>
  encodeURI(
    `${settings.NTB_HOST}/${path}${id ? `/${id}` : ''}` +
    `?api_key=${settings.NTB_KEY}&${querystring.stringify(options)}`
  );


const getCount = (path) =>
  fetch(createUrl(path, null, { limit: 1 }))
    .then((res) => res.json())
    .then((json) => json.total);


const getObjectIdAtIndex = (path, index, idx) => () => {
  const t0 = now();
  const options = {
    limit: 1,
    skip: index,
  };
  return fetch(createUrl(path, null, options))
    .then((res) => res.json())
    .then((json) => {
      const t1 = now();
      console.log(`    - ${idx}: ${Math.round(t1 - t0)} ms`);
      return json.documents[0]._id;
    });
};


const getObjectById = (path, id, idx) => () => {
  const t0 = now();
  return fetch(createUrl(path, id))
    .then((res) => res.json())
    .then((json) => {
      const t1 = now();
      console.log(`    - ${idx}: ${Math.round(t1 - t0)} ms`);
      return json;
    });
};


const getObjectIdsSubset = (path, skip, id) => () => {
  const t0 = now();
  const options = {
    limit: (settings.DEBUG ? 10 : 100),
    skip,
  };
  return fetch(createUrl(path, null, options))
    .then((res) => res.json())
    .then((json) => {
      const t1 = now();
      console.log(`    - ${id}: ${Math.round(t1 - t0)} ms`);
      return json.documents.map((obj) => obj._id);
    });
};


const getObjectIds = async (path, limit) => {
  const count = await getCount(path);
  let ids = [];
  const maxCount = limit || count;
  console.log(
    `  - API reports ${count} objects. ` +
    `${limit ? `Limited to ${limit}. ` : ''}` +
    'Fetching 100 per request'
  );

  // Queue all requests
  const queue = new PQueue({ concurrency: settings.CONCURRENCY });
  const addToQueue = (subsetIds) => { ids = ids.concat(subsetIds); };
  let i = 1;
  let skip = 0;
  while (skip < maxCount) {
    queue
      .add(getObjectIdsSubset(path, skip, i))
      .then(addToQueue);
    i += 1;
    skip += 100;
  }

  await queue.onIdle();
  return ids;
};


const getObjectsSubset = (path, structure, skip, id) => () => {
  const t0 = now();
  const options = {
    limit: (settings.DEBUG ? 10 : 100),
    skip,
    fields: Object.keys(structure).join(','),
  };
  return fetch(createUrl(path, null, options))
    .then((res) => res.json())
    .then((json) => {
      const t1 = now();
      console.log(`    - ${id}: ${Math.round(t1 - t0)} ms`);
      return json.documents;
    });
};


const verify = (obj, id, legacyStructure, log = {}, path = '') => {
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

      if (!type) {
        // If key does not exist in defined legacy structure
        isValid = false;
      } else if (type === 'ignore') {
        // ignore type checking
        isValid = true;
      } else if (helpers.isObject(type)) {
        if (!helpers.isObject(value)) {
          // if object type but value is not an object
          isValid = false;
        } else {
          // verify nested object
          const p = `${path ? `${path}.` : ''}${key}`;
          isValid = verify(value, id, type, log, p);
        }
      } else if (Array.isArray(type)) {
        // Array of objects
        if (!Array.isArray(value)) {
          // if array of objects type but value is not an array
          isValid = false;
        } else {
          // verify nested object
          const p = `${path ? `${path}.` : ''}${key}`;
          value.forEach((v) => {
            if (!verify(v, id, type[0], log, p)) {
              isValid = false;
            }
          });
        }
      } else if (type === 'string' && !helpers.isString(value)) {
        // if string type does not match
        isValid = false;
      } else if (type === 'number' && !helpers.isNumber(value)) {
        // if number type does not match
        isValid = false;
      } else if (type === 'date' && !helpers.isDate(value)) {
        // if date type but not able to parse as date
        isValid = false;
      } else if (type === 'boolean' && !helpers.isBoolean(value)) {
        // if boolean type but type does not match
        isValid = false;
      } else if (arrayTypes.indexOf(type) !== -1 && !Array.isArray(value)) {
        // if array type but not an array
        isValid = false;
      } else if (type === 'array-strings') {
        value.forEach((v) => {
          if (!helpers.isString(v)) {
            // if array of strings but a value is not a string
            isValid = false;
          }
        });
      } else if (type === 'array-numbers') {
        value.forEach((v) => {
          if (!helpers.isNumber(v)) {
            // if array of numbers but a value is not a string
            isValid = false;
          }
        });
      } else if (type === 'geojson') {
        // verify GeoJson data
        GJV.valid(value, (valid, errs) => {
          if (!valid) {
            isValid = false;
            log.errors.push(
              `GeoJSON error on ID: ${id} - ${errs}`
            );
          }
        });
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
};


const verifyObjects = (objects, structure) => {
  console.log('  - Verifying object structure');
  let verified = true;
  let errors = [];
  objects.forEach((obj) => {
    const status = verify(obj, obj._id, structure);
    if (!status.verified) {
      verified = false;
      errors = errors.concat(status.errors);
    }
  });

  console.log(`  - ${
    verified
      ? 'Object structures OK'
      : 'Object structures is NOT verified'
  }`);

  if (!verified) {
    errors.forEach((err) => console.log(`    - ${err}`));
  }

  return verified;
};


const getObjects = async (path, structure) => {
  console.log(`*** ${path} ***`);
  console.log('- Fetching object count');
  const count = await getCount(path);
  console.log(`  - Number of objects: ${count}`);
  let objects = [];

  const queue = new PQueue({ concurrency: settings.CONCURRENCY });

  const addObjects = (subset) => {
    objects = objects.concat(subset);
  };

  // Queue all requests
  let i = 1;
  let skip = 0;
  while (skip < count) {
    queue.add(getObjectsSubset(path, structure, skip, i))
      .then(addObjects);
    i += 1;
    skip += 100;
  }

  console.log(
    `  - Fetching objects using ${i - 1} requests with ` +
    `${settings.CONCURRENCY} concurrency`
  );

  await queue.onIdle();
  const verified = verifyObjects(objects, structure);
  if (!verified) {
    throw new Error('Object structures is NOT verified');
  }

  return objects;
};


const testRandomObjects = async (path, structure, testCount = 50) => {
  console.log('- Identifying missing legacy fields');

  const count = await getCount(path);
  const randomCount = count < testCount ? count : testCount;

  console.log(`  - Total number of objects: ${count}`);
  console.log(`  - Testing ${randomCount} random objects`);
  console.log(`  - Fetching IDs at ${randomCount} random indexes`);

  const randomIndexes = helpers.getRandomIndexes(count, randomCount);
  const ids = [];
  const idQueue = new PQueue({ concurrency: settings.CONCURRENCY });
  randomIndexes.forEach((index, idx) => {
    idQueue.add(getObjectIdAtIndex(path, index, idx + 1))
      .then((id) => {
        ids.push(id);
      });
  });

  await idQueue.onIdle();

  console.log(`  - ${ids.length} object IDs fetched.`);
  console.log('  - Fetching full objects');

  const objectsQueue = new PQueue({ concurrency: settings.CONCURRENCY });
  const objects = [];
  const pushObj = (obj) => objects.push(obj);

  ids.forEach((id, idx) => {
    objectsQueue.add(getObjectById(path, id, idx))
      .then(pushObj);
  });

  await objectsQueue.onIdle();
  const verified = verifyObjects(objects, structure);
  return verified;
};


const testStructureOfAllObjects = async (path, structure, limit = null) => {
  console.log('- Verifying defined legacy structure of all objects');

  console.log('- Fetching all objects IDs');
  const ids = await getObjectIds(path, limit);

  console.log('  - Fetching full objects');
  const objectsQueue = new PQueue({ concurrency: settings.CONCURRENCY });
  const objects = [];
  const addObject = (obj) => objects.push(obj);

  ids.forEach((id, idx) => {
    objectsQueue.add(getObjectById(path, id, idx))
      .then(addObject);
  });

  await objectsQueue.onIdle();
  const verified = verifyObjects(objects, structure);
  return verified;
};


module.exports = {
  getObjects,
  testRandomObjects,
  testStructureOfAllObjects,
};

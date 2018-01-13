'use strict';

const querystring = require('querystring');
// const neo4j = require('neo4j-driver').v1;
const PQueue = require('p-queue');
const fetch = require('isomorphic-fetch');
const now = require('performance-now');
const GJV = require('geojson-validation');

const settings = require('../lib/settings');
const helpers = require('../lib/helpers');


class Abstract {
  constructor() {
    this.log = {
      objectStructuresVerified: true,
      objectStructureErrors: [],
    };
  }

  // eslint-disable-next-line class-methods-use-this
  legacyType() {
    throw new Error(
      'Abstract needs to be extended and legacyType() must be defined'
    );
  }

  // eslint-disable-next-line class-methods-use-this
  label() {
    throw new Error(
      'Abstract needs to be extended and label() must be defined'
    );
  }

  // eslint-disable-next-line class-methods-use-this
  legacyStructure() {
    throw new Error(
      'Abstract needs to be extended and legacyStructure() must be defined'
    );
  }

  // eslint-disable-next-line class-methods-use-this
  createUrl(id = null, options = {}) {
    return encodeURI(
      `${settings.NTB_HOST}/${this.legacyType()}${id ? `/${id}` : ''}` +
      `?api_key=${settings.NTB_KEY}&${querystring.stringify(options)}`
    );
  }

  getLegacyFields() {
    return Object.keys(this.getLegacyStructure());
  }

  getCount() {
    return fetch(this.createUrl(null, { limit: 1 }))
      .then((res) => res.json())
      .then((json) => json.total);
  }

  getObjectIdsSubset(skip, id) {
    return () => {
      const t0 = now();
      const options = {
        limit: (settings.DEBUG ? 10 : 100),
        skip,
      };
      return fetch(this.createUrl(null, options))
        .then((res) => res.json())
        .then((json) => {
          const t1 = now();
          console.log(`    - ${id}: ${Math.round(t1 - t0)} ms`);
          return json.documents.map((obj) => obj._id);
        });
    };
  }

  getObjectIds(limit) {
    return this.getCount()
      .then((count) => {
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
            .add(this.getObjectIdsSubset(skip, i))
            .then(addToQueue);
          i += 1;
          skip += 100;
        }

        return queue
          .onIdle()
          .then(() => ids);
      });
  }

  getObjectIdAtIndex(index, idx) {
    return () => {
      const t0 = now();
      const options = {
        limit: 1,
        skip: index,
      };
      return fetch(this.createUrl(null, options))
        .then((res) => res.json())
        .then((json) => {
          const t1 = now();
          console.log(`    - ${idx}: ${Math.round(t1 - t0)} ms`);
          return json.documents[0]._id;
        });
    };
  }

  getObjectById(id, idx) {
    return () => {
      const t0 = now();
      return fetch(this.createUrl(id))
        .then((res) => res.json())
        .then((json) => {
          const t1 = now();
          console.log(`    - ${idx}: ${Math.round(t1 - t0)} ms`);
          return json;
        });
    };
  }

  getObjectsSubset(skip, id) {
    return () => {
      const t0 = now();
      const options = {
        limit: (settings.DEBUG ? 10 : 100),
        skip,
        fields: this.getLegacyFields().join(','),
      };
      return fetch(this.createUrl(null, options))
        .then((res) => res.json())
        .then((json) => {
          const t1 = now();
          console.log(`    - ${id}: ${Math.round(t1 - t0)} ms`);
          return json.documents;
        });
    };
  }

  getObjects() {
    console.log('- Fetching all Places');
    return this.getCount()
      .then((count) => {
        console.log(`  - Number of objects: ${count}`);
        let objects = [];

        const queue = new PQueue({ concurrency: settings.CONCURRENCY });

        const addObjects = (subset) => {
          subset.forEach((obj) => {
            this.verifyObjectStructure(obj, obj._id);
          });
          objects = objects.concat(subset);
        };

        // Queue all requests
        let i = 1;
        let skip = 0;
        while (skip < count) {
          queue.add(this.getObjectsSubset(skip, i))
            .then(addObjects);
          i += 1;
          skip += 100;
        }

        console.log(
          `  - Fetching objects using ${i - 1} requests with ` +
          `${settings.CONCURRENCY} concurrency`
        );

        return queue.onIdle()
          .then(() => objects);
      });
  }

  verifyObjectStructure(obj, id, structure = null, path = '') {
    let objectStructureVerified = true;
    const legacyStructure = structure || this.getLegacyStructure();
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
            isValid = this.verifyObjectStructure(value, id, type, p);
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
              if (!this.verifyObjectStructure(v, id, type[0], p)) {
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
              this.log.objectStructureErrors.push(
                `GeoJSON error on ID: ${id} - ${errs}`
              );
            }
          });
        }

        // Log if not valid
        if (!isValid) {
          objectStructureVerified = false;
          this.log.objectStructureErrors.push(
            `Structure error on ID: ${id} - ` +
            `path: ${path || 'root'} - key: ${key}`
          );
        }
      }
    });

    this.log.objectStructuresVerified = objectStructureVerified;

    return objectStructureVerified;
  }

  printLog() {
    console.log(`- ${this.label()} log`);
    console.log(`  - ${
      this.log.objectStructuresVerified
        ? 'Object structures OK'
        : 'Object structures is NOT verified'
    }`);

    if (!this.log.objectStructuresVerified) {
      this.log.objectStructureErrors.forEach((err) => {
        console.log(`    - ${err}`);
      });
    }
  }

  testStructureOfRandomObjects(testCount = 50) {
    console.log('- Identifying missing legacy fields');
    this.getCount()
      .then((count) => {
        const randomCount = count < testCount ? count : testCount;
        console.log(`  - Total number of objects: ${count}`);
        console.log(`  - Testing ${randomCount} random objects`);
        console.log(`  - Fetching IDs at ${randomCount} random indexes`);
        const randomIndexes = helpers.getRandomIndexes(count, randomCount);
        const ids = [];
        const idQueue = new PQueue({ concurrency: settings.CONCURRENCY });
        randomIndexes.forEach((index, idx) => {
          idQueue.add(this.getObjectIdAtIndex(index, idx + 1))
            .then((id) => {
              ids.push(id);
            });
        });

        idQueue.onIdle()
          .then(() => {
            console.log(`  - ${ids.length} object IDs fetched.`);
            console.log('  - Fetching full objects');

            const objectsQueue = new PQueue({
              concurrency: settings.CONCURRENCY,
            });
            const objects = [];

            ids.forEach((id, idx) => {
              objectsQueue.add(this.getObjectById(id, idx))
                .then((obj) => {
                  objects.push(obj);
                });
            });

            return objectsQueue.onIdle()
              .then(() => {
                console.log('  - Verifying object structure');
                objects.forEach((obj) => {
                  this.verifyObjectStructure(obj, obj._id);
                });

                this.printLog();
              });
          });
      });
  }

  testStructureOfAllObjects(limit = null) {
    console.log('- Verifying defined legacy structure of all objects');
    console.log('- Fetching all objects IDs');
    return this.getObjectIds(limit)
      .then((ids) => {
        console.log('  - Fetching full objects');

        const objectsQueue = new PQueue({ concurrency: settings.CONCURRENCY });
        const objects = [];

        ids.forEach((id, idx) => {
          objectsQueue.add(this.getObjectById(id, idx))
            .then((obj) => {
              objects.push(obj);
            });
        });

        return objectsQueue.onIdle()
          .then(() => {
            console.log('  - Verifying object structure');
            objects.forEach((obj) => {
              this.verifyObjectStructure(obj, obj._id);
            });

            this.printLog();
          });
      });
  }
}


module.exports = Abstract;

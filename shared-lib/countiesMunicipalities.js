'use strict';

const counties = require('../data/counties.json').containeditems;
const municipalities = require('../data/counties.json').containeditems;

// Add known replacement labels to the *_LEGACY_MAPPING objects below.
const COUNTIES_LEGACY_MAPPING = {
  // 'Sør-Trøndelag' to 'Trøndelag'
  'f4a81b95-5ccc-4593-8a77-ccb99148173f':
    'a12d84a9-1ee4-4ca5-b2a4-636938929b5e',
  // 'Nord-Trøndelag' to 'Trøndelag'
  '4ff0520e-696e-4551-a64e-5c55db92f9e3':
    'a12d84a9-1ee4-4ca5-b2a4-636938929b5e',
};

const MUNICIPALITIES_LEGACY_MAPPING = {
};
/* eslint-enable quote-props */

const COUNTIES_EXPIRED = new Set(
  Object.keys(COUNTIES_LEGACY_MAPPING)
) || [];
const COUNTIES_REPLACEMENT = new Set(
  Object.values(COUNTIES_LEGACY_MAPPING)
) || [];
const MUNICIPALITIES_EXPIRED = new Set(
  Object.keys(MUNICIPALITIES_LEGACY_MAPPING)
) || [];
const MUNICIPALITIES_REPLACEMENT = new Set(
  Object.values(MUNICIPALITIES_LEGACY_MAPPING)
) || [];


const findByUUID = (type, uuid, includeExpiredInfo = true) => {
  let expired;
  let legacyMapping;
  let replacement;
  let data;

  if (type === 'county') {
    data = counties;
    legacyMapping = COUNTIES_LEGACY_MAPPING;
    expired = COUNTIES_EXPIRED;
    replacement = COUNTIES_REPLACEMENT;
  }
  else {
    data = municipalities;
    legacyMapping = MUNICIPALITIES_LEGACY_MAPPING;
    expired = MUNICIPALITIES_EXPIRED;
    replacement = MUNICIPALITIES_REPLACEMENT;
  }

  // Ignore future counties and municipalities
  data = data.filter((m) => m.status.toLowerCase() !== 'innsendt');

  const match = data.filter((c) => c.uuid.toLowerCase() === uuid.toLowerCase())[0];
  const result = {
    active: true,
    replace: false,
    data: {
      uuid: match.uuid,
      name: match.description,
      code: match.label,
    },
  };

  // If this county is expired
  if (includeExpiredInfo && match.status.toLowerCase() === 'utgått') {
    result.active = false;

    // If we have data on the replacement
    if (expired.has(uuid)) {
      result.replacement = findByUUID(type, legacyMapping[uuid]);
    }
  }
  // If we know this county replaces others
  else if (includeExpiredInfo && replacement.has(uuid)) {
    result.replace = true;
    result.replaces = [];
    Object.keys(legacyMapping)
      .filter((key) => legacyMapping[key] === uuid)
      .forEach((key) => {
        result.replaces.push(findByUUID(type, key, false).data);
      });
  }

  return result;
};


const findByCode = (type, code) => {
  const match = counties
    .filter((c) => c.label === code);

  if (!match.length) {
    return null;
  }

  return findByUUID(type, match[0].uuid);
};


const findByName = (type, name) => {
  const match = counties
    .filter((c) => c.description.toLowerCase() === name.toLowerCase());

  if (!match.length) {
    return null;
  }

  return {
    count: match.length,
    data: match.map((x) => findByUUID(type, x.uuid)),
  };
};


module.exports = {
  findByUUID,
  findByCode,
  findByName,
};

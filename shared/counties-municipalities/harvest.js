'use strict';

const fetch = require('isomorphic-fetch');
const now = require('performance-now');


const COUNTIES_API_URL = 'https://register.geonorge.no/subregister/sosi-kodelister/kartverket/fylkesnummer-alle';
const MUNICIPALITIES_API_URL = 'https://register.geonorge.no/subregister/sosi-kodelister/kartverket/kommunenummer-alle';


const formatDuration = (t) => ((now() - t) / 1000).toFixed(3);


const getData = async (type) => {
  const url = type === 'counties'
    ? COUNTIES_API_URL
    : MUNICIPALITIES_API_URL;

  const options = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  };

  console.log(`  - Fetching ${type} from Kartverket-API`);
  const t0 = now();
  const res = await fetch(url, options);
  console.log(`    - done (${formatDuration(t0)} s)`);

  const data = await res.json();
  return data.containeditems
    .filter((i) => i.status.toLowerCase() !== 'innsendt')
    .filter((i) => {
      if (!i.ValidTo) {
        return true;
      }
      const d = new Date(i.ValidTo);
      const limit = new Date(2010, 1, 1);
      if (d >= limit) {
        return true;
      }

      return false;
    });
};


const translateStatus = (status) => {
  switch (status.toLowerCase()) {
    case 'utgått':
      return 'expired';
    case 'gyldig':
      return 'active';
    default:
      return 'unknown';
  }
};


const processData = (data, counties = null) => {
  const items = [];
  const translations = [];
  const translationRefs = {};
  const locatedIn = [];

  data.forEach((item) => {
    const names = item.description.split(' - ');
    const name = names[0];
    const smeName = names.length > 1 ? names[1] : null;

    items.push({
      uuid: item.uuid,
      code: item.label,
      name,
      name_lowercase: name.toLowerCase(),
      status: translateStatus(item.status),
    });

    if (smeName) {
      translations.push({
        uuid: item.uuid,
        name: smeName,
        language: 'sme',
        name_lowercase: smeName.toLowerCase(),
      });

      if (!translationRefs[item.uuid]) {
        translationRefs[item.uuid] = {
          uuid: item.uuid,
          languages: ['sme'],
        };
      }
    }

    if (item.label.length === 4) {
      const countyLabel = item.label.substr(0, 2);
      const county = counties.filter((c) => c.label === countyLabel)[0];
      locatedIn.push({
        county: county.uuid,
        municipality: item.uuid,
      });
    }
  });

  return {
    items,
    translations,
    translationRefs,
    locatedIn,
  };
};


const addToDb = async (session, label, data) => {
  let query;

  // Create County/Municipality
  console.log(`  - Creating/updating ${label} in DB`);
  query = [
    'UNWIND $items AS item',
    `MERGE (c:${label} {uuid:item.uuid})`,
    'ON CREATE SET c = item',
    'ON MATCH SET c = item',
  ].join('\n');
  const t0 = now();
  await session.run(query, { items: data.items });
  console.log(`    - done (${formatDuration(t0)} s)`);

  // Create translations
  console.log(`  - Creating/updating translations for ${label} in DB`);
  query = [
    'UNWIND $items AS item',
    `MATCH (c:${label} {uuid:item.uuid})`,
    `MERGE (t:${label}Translation {uuid:item.uuid})`,
    'ON CREATE SET t = item',
    'ON MATCH SET t = item',
    'MERGE (t)-[:TRANSLATION {language:item.language}]->(c)',
  ].join('\n');
  const t1 = now();
  await session.run(query, { items: data.translations });
  console.log(`    - done (${formatDuration(t1)} s)`);

  // Delete translations on objects that does not have any translations
  console.log(`  - Deleting deprecated translations for ${label} in DB (1/2)`);
  query = [
    `MATCH (c:${label})-[r:TRANSLATION]-(x:${label}Translation)`,
    'WHERE NOT c.uuid IN $refs',
    'DETACH DELETE x',
  ].join('\n');
  const t2 = now();
  await session.run(query, { refs: data.translations.map((i) => i.uuid) });
  console.log(`    - done (${formatDuration(t2)} s)`);

  // Delete translations on objects that does not have any translations
  console.log(`  - Deleting deprecated translations for ${label} in DB (2/2)`);
  query = [
    'UNWIND $refs AS ref',
    `MATCH (c:${label})-[r:TRANSLATION]-(x:${label}Translation)`,
    'WHERE c.uuid = ref.uuid',
    '      AND NOT r.language IN ref.languages',
    'DETACH DELETE x',
  ].join('\n');
  const t3 = now();
  await session.run(query, { refs: Object.values(data.translationRefs) });
  console.log(`    - done (${formatDuration(t3)} s)`);

  // Create (municipality)-[:LOCATED_IN]->(county) relations
  if (data.locatedIn.length) {
    console.log('  - Creating/updating municipality-->county relations in DB');
    query = [
      'UNWIND $items AS item',
      'MATCH (c:County {uuid:item.county}),',
      '      (m:Municipality {uuid:item.municipality})',
      'MERGE (m)-[:LOCATED_IN]->(c)',
    ].join('\n');
    const t4 = now();
    await session.run(query, { items: data.locatedIn });
    console.log(`    - done (${formatDuration(t4)} s)`);
  }
};


const harvest = async (session) => {
  const counties = await getData('counties');
  const municipalities = await getData('municipalities');


  const countiesData = processData(counties);
  await addToDb(session, 'County', countiesData);

  const municipalityData = processData(municipalities, counties);
  await addToDb(session, 'Municipality', municipalityData);
};


module.exports = harvest;

'use strict';

const { performance } = require('perf_hooks'); // eslint-disable-line
const { MongoClient } = require('mongodb');
const settings = require('@turistforeningen/ntb-shared-settings');
const CM = require('@turistforeningen/ntb-shared-counties-municipalities');

const legacy = require('./legacy-structure/legacy');
const verify = require('./lib/verify');
const processArea = require('./process/area');

const neo4jUtils = require('@turistforeningen/ntb-shared-neo4j-utils');


const getCollectionDocuments = (db, collectionName) =>
  new Promise((resolve) => {
    const collection = db.collection(collectionName);

    collection.find({ status: { $ne: 'Slettet' } }).toArray((err, items) => {
      resolve(items);
    });
  });


const getAllDocuments = async (db, handler) => {
  console.log('- Fetching all documents from mongodb');
  const documents = {};
  performance.mark('a');
  await Promise.all(
    ['områder', 'lister'].map(async (type) => {
      documents[type] = await getCollectionDocuments(db, type);
      documents[type].forEach((document) => {
        document._id = document._id.toString();
      });
    })
  );
  performance.mark('b');
  handler.printDone();

  return documents;
};


const verifyAllDocuments = (handler) => {
  let verified = true;

  Object.keys(handler.documents).forEach((type) => {
    console.log(`- Verifying structure of <${type}>`);
    const { structure } = legacy[type];
    handler.documents[type].forEach((obj) => {
      const status = verify(obj, obj._id, structure);
      if (!status.verified) {
        verified = false;
        status.errors.forEach((e) => console.log(e));
      }
    });
  });

  return verified;
};


const getAllCM = async (handler) => {
  console.log('- Fetching all counties from Neo4j');
  performance.mark('a');
  handler.counties = await CM.counties.all(handler.session);
  performance.mark('b');
  handler.printDone();

  console.log('- Fetching all municipalities from Neo4j');
  performance.mark('a');
  handler.municipalities = await CM.municipalities.all(handler.session);
  performance.mark('b');
  handler.printDone();
};


// const processArea = async (session, documents) => {
//   console.log('- Processing areas');
//   let query;
//   let result;

//   const legacyDocuments = documents['områder'];
//   const areas = [];
//   await Promise.all(
//     legacyDocuments.map(async (d) => {
//       const area = await legacy.områder.mapping(d, session);
//       areas.push(area);
//     })
//   );

//   console.log('  - Fetching current areas');
//   query = 'MATCH (a:Area) RETURN a.id_legacy_ntb';
//   result = await runQuery(session, query);

//   const idsToDelete = [];
//   if (result.records.length) {
//     const existingIds = areas.map((a) => a.area.id_legacy_ntb);
//     result.records.forEach((r) => {
//       const id = r.get(0);
//       if (!existingIds.includes(id)) {
//         idsToDelete.push(id);
//       }
//     });
//   }

//   if (idsToDelete.length) {
//     console.log(`  - Delete old areas (${idsToDelete.length})`);
//     query = [
//       'MATCH (a:Area)',
//       'WHERE a.id_legacy_ntb IN $ids',
//       'DETACH DELETE a',
//     ].join('\n');
//     await runQuery(session, query, { ids: idsToDelete });
//   }

//   console.log('  - Adding/updating areas');
//   query = [
//     'UNWIND $items as item',
//     'MERGE (a:Area {id_legacy_ntb:item.area.id_legacy_ntb})',
//     'ON CREATE SET a = item.area',
//     'ON MATCH SET a = item.area',
//   ].join('\n');
//   await runQuery(session, query, { items: areas });


//   console.log('  - Fetching current (Area)-->(County) relations');
//   query = [
//     'MATCH (a:Area)-[:LOCATED_IN]->(c:County)',
//     'RETURN a.id_legacy_ntb, c.uuid',
//   ].join('\n');
//   result = await runQuery(session, query);


//   // Identify existing relations that should be deleted
//   const relationsToDelete = [];
//   if (result.records.length) {
//     result.records.forEach((r) => {
//       const id = r.get(0);
//       const uuid = r.get(1);
//       const area = areas.filter((a) => a.area.id_legacy_ntb === id);
//       if (area.length) {
//         if (!area[0].counties || !area[0].counties.includes(uuid)) {
//           relationsToDelete.push({ id_legacy_ntb: id, uuid });
//         }
//       }
//     });
//   }

//   if (relationsToDelete.length) {
//     console.log(
//       '  - Delete old (Area)-->(County) relations ' +
//       ` (${relationsToDelete.length})`
//     );
//     query = [
//       'UNWIND $items as item',
//       'MATCH (a:Area)-[r:LOCATED_IN]->(c:County)',
//       'WHERE a.id_legacy_ntb = item.id_legacy_ntb',
//       '      AND c.uuid = item.uuid',
//       'DELETE r',
//     ].join('\n');
//     await runQuery(session, query, { items: relationsToDelete });
//   }

//   console.log('  - Adding/updating (Area)-->(County) relations');
//   query = [
//     'UNWIND $items as item',
//     'MATCH (a:Area {id_legacy_ntb:item.area.id_legacy_ntb})',
//     'WITH a, item',
//     'UNWIND item.counties AS uuid',
//     'MATCH (c:County {uuid:uuid})',
//     'MERGE (a)-[:LOCATED_IN]->(c)',
//   ].join('\n');
//   await runQuery(session, query, { items: areas });
// };


const printDone = (padding = 4, m1 = 'a', m2 = 'b', clearMarks = true) => {
  const label = `${m1} to ${m2}`;
  performance.measure(label, m1, m2);
  const measure = performance.getEntriesByName(label)[0];
  console.log(
    `${' '.repeat(padding)}- done ${(measure.duration / 1000).toFixed(3)} s`
  );
  performance.clearMeasures(label);

  if (clearMarks) {
    performance.clearMarks(m1);
    performance.clearMarks(m2);
  }
};


const main = async (db) => {
  const handler = {};
  handler.printDone = printDone;
  performance.mark('main-a');

  handler.documents = await getAllDocuments(db, handler);

  if (!verifyAllDocuments(handler)) {
    throw new Error('Document verification failed.');
  }

  const driver = neo4jUtils.createDriver();
  handler.session = neo4jUtils.createSession(driver);

  await getAllCM(handler);

  await processArea(handler);

  performance.mark('main-b');
  handler.printDone(0, 'main-a', 'main-b');
  handler.session.close();
  driver.close();
};

MongoClient.connect(settings.LEGACY_MONGO_DB_URI)
  .then(async (client) => {
    const db = client.db(settings.LEGACY_MONGO_DB_NAME);
    await main(db);
    client.close();
    process.exit(0);
  })
  .catch((err) => {
    console.log('ERROR - some error occured');
    console.log(err);
    console.log(err.stack);
    process.exit(1);
  });

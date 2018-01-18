'use strict';

const { performance } = require('perf_hooks'); // eslint-disable-line

const legacy = require('../legacy-structure/legacy');


const mapData = (handler) => {
  const areas = handler.documents['områder'].map((d) => {
    return legacy.områder.mapping(d, handler);
  });

  return areas;
};


const findAreaIdsToDelete = async (handler) => {
  console.log('    - Fetching current areas');

  performance.mark('a');
  const query = 'MATCH (a:Area) RETURN a.id_legacy_ntb';
  const result = await handler.session.run(query);
  performance.mark('b');

  handler.printDone(6);

  const idsToDelete = [];
  if (result.records.length) {
    const existingIds = handler.areas.map((a) => a.area.id_legacy_ntb);
    result.records.forEach((r) => {
      const id = r.get(0);
      if (!existingIds.includes(id)) {
        idsToDelete.push(id);
      }
    });
  }

  console.log(`    - Found ${idsToDelete.length} unknown areas`);

  return idsToDelete;
};


const deleteUnknownAreas = async (handler) => {
  console.log('  - Identifying unknown areas in Neo4j');
  const idsToDelete = await findAreaIdsToDelete(handler);

  if (idsToDelete.length) {
    console.log('  - Delete old areas');
    const query = [
      'MATCH (a:Area)',
      'WHERE a.id_legacy_ntb IN $ids',
      'DETACH DELETE a',
    ].join('\n');

    performance.mark('a');
    await handler.session.run(query, { ids: idsToDelete });
    performance.mark('b');
    handler.printDone();
  }
};


const mergeAreas = async (handler) => {
  console.log('  - Adding/updating areas');
  const query = [
    'UNWIND $items as item',
    'MERGE (a:Area {id_legacy_ntb:item.area.id_legacy_ntb})',
    'ON CREATE SET a = item.area',
    'ON MATCH SET a = item.area',
  ].join('\n');

  performance.mark('a');
  await handler.session.run(query, { items: handler.areas });
  performance.mark('b');
  handler.printDone();
};


const findCountyRelationsToDelete = async (handler) => {
  console.log('    - Fetching current (Area)-->(County) relations');
  const query = [
    'MATCH (a:Area)-[:LOCATED_IN]->(c:County)',
    'RETURN a.id_legacy_ntb, c.uuid',
  ].join('\n');

  performance.mark('a');
  const result = await handler.session.run(query);
  performance.mark('b');
  handler.printDone(6);

  // Identify existing relations that should be deleted
  const relationsToDelete = [];
  if (result.records.length) {
    result.records.forEach((r) => {
      const id = r.get(0);
      const uuid = r.get(1);
      const area = handler.areas.filter((a) => a.area.id_legacy_ntb === id);
      if (area.length) {
        if (!area[0].counties || !area[0].counties.includes(uuid)) {
          relationsToDelete.push({ id_legacy_ntb: id, uuid });
        }
      }
    });
  }

  console.log(`    - Found ${relationsToDelete.length} unknown relations`);

  return relationsToDelete;
};


const deleteUnkownCountyRelations = async (handler) => {
  console.log('  - Identifying unknown (Area)-->(County) relations');
  const relationsToDelete = await findCountyRelationsToDelete(handler);

  if (relationsToDelete.length) {
    console.log('  - Delete old (Area)-->(County) relations ');
    const query = [
      'UNWIND $items as item',
      'MATCH (a:Area)-[r:LOCATED_IN]->(c:County)',
      'WHERE a.id_legacy_ntb = item.id_legacy_ntb',
      '      AND c.uuid = item.uuid',
      'DELETE r',
    ].join('\n');

    performance.mark('a');
    await handler.session.run(query, { items: relationsToDelete });
    performance.mark('b');
    handler.printDone();
  }
};


const mergeCountyRelations = async (handler) => {
  console.log('  - Adding/updating (Area)-->(County) relations');
  const query = [
    'UNWIND $items as item',
    'MATCH (a:Area {id_legacy_ntb:item.area.id_legacy_ntb})',
    'WITH a, item',
    'UNWIND item.counties AS uuid',
    'MATCH (c:County {uuid:uuid})',
    'MERGE (a)-[:LOCATED_IN]->(c)',
  ].join('\n');

  performance.mark('a');
  await handler.session.run(query, {
    items: handler.areas.filter((a) => a.counties.length),
  });
  performance.mark('b');
  handler.printDone();
};


const findMunicipalityRelationsToDelete = async (handler) => {
  console.log('    - Fetching current (Area)-->(Municipality) relations');
  const query = [
    'MATCH (a:Area)-[:LOCATED_IN]->(m:Municipality)',
    'RETURN a.id_legacy_ntb, m.uuid',
  ].join('\n');

  performance.mark('a');
  const result = await handler.session.run(query);
  performance.mark('b');
  handler.printDone(6);

  // Identify existing relations that should be deleted
  const relationsToDelete = [];
  if (result.records.length) {
    result.records.forEach((r) => {
      const id = r.get(0);
      const uuid = r.get(1);
      const area = handler.areas.filter((a) => a.area.id_legacy_ntb === id);
      if (area.length) {
        const { municipalities } = area[0];
        if (!municipalities || !municipalities.includes(uuid)) {
          relationsToDelete.push({ id_legacy_ntb: id, uuid });
        }
      }
    });
  }

  console.log(`    - Found ${relationsToDelete.length} unknown relations`);

  return relationsToDelete;
};


const deleteUnkownMunicipalityRelations = async (handler) => {
  console.log('  - Identifying unknown (Area)-->(Municipality) relations');
  const relationsToDelete = await findMunicipalityRelationsToDelete(handler);

  if (relationsToDelete.length) {
    console.log('  - Delete old (Area)-->(Municipality) relations ');
    const query = [
      'UNWIND $items as item',
      'MATCH (a:Area)-[r:LOCATED_IN]->(m:Municipality)',
      'WHERE a.id_legacy_ntb = item.id_legacy_ntb',
      '      AND m.uuid = item.uuid',
      'DELETE r',
    ].join('\n');

    performance.mark('a');
    await handler.session.run(query, { items: relationsToDelete });
    performance.mark('b');
    handler.printDone();
  }
};


const mergeMunicipalityRelations = async (handler) => {
  console.log('  - Adding/updating (Area)-->(Municipality) relations');
  const query = [
    'UNWIND $items as item',
    'MATCH (a:Area {id_legacy_ntb:item.area.id_legacy_ntb})',
    'WITH a, item',
    'UNWIND item.municipalities AS uuid',
    'MATCH (m:Municipality {uuid:uuid})',
    'MERGE (a)-[:LOCATED_IN]->(m)',
  ].join('\n');

  performance.mark('a');
  await handler.session.run(query, {
    items: handler.areas.filter((a) => a.municipalities.length),
  });
  performance.mark('b');
  handler.printDone();
};


const findAreaToAreaRelationsToDelete = async (handler) => {
  console.log('    - Fetching current (Area)-->(Area) relations');
  const query = [
    'MATCH (a1:Area)-[:LOCATED_IN]->(a2:Area)',
    'RETURN a1.id_legacy_ntb, a2.id_legacy_ntb',
  ].join('\n');

  performance.mark('a');
  const result = await handler.session.run(query);
  performance.mark('b');
  handler.printDone(6);

  // Identify existing relations that should be deleted
  const relationsToDelete = [];
  if (result.records.length) {
    result.records.forEach((r) => {
      const a1 = r.get(0);
      const a2 = r.get(1);
      const area = handler.areas.filter((a) => a.area.id_legacy_ntb === a1);
      if (area.length) {
        const { areaRelations } = area[0];
        if (!areaRelations || !areaRelations.includes(a2)) {
          relationsToDelete.push({ a1, a2 });
        }
      }
    });
  }

  console.log(`    - Found ${relationsToDelete.length} unknown relations`);

  return relationsToDelete;
};


const deleteUnkownAreaToAreaRelations = async (handler) => {
  console.log('  - Identifying unknown (Area)-->(Area) relations');
  const relationsToDelete = await findAreaToAreaRelationsToDelete(handler);

  if (relationsToDelete.length) {
    console.log('  - Delete old (Area)-->(Area) relations ');
    const query = [
      'UNWIND $items as item',
      'MATCH (a1:Area)-[r:LOCATED_IN]->(a2:Area)',
      'WHERE a1.id_legacy_ntb = item.a1',
      '      AND a2.id_legacy_ntb = item.a2',
      'DELETE r',
    ].join('\n');

    performance.mark('a');
    await handler.session.run(query, { items: relationsToDelete });
    performance.mark('b');
    handler.printDone();
  }
};


const mergeAreaToAreaRelations = async (handler) => {
  console.log('  - Adding/updating (Area)-->(Area) relations');
  const query = [
    'UNWIND $items as item',
    'MATCH (a1:Area {id_legacy_ntb:item.area.id_legacy_ntb})',
    'WITH a1, item',
    'UNWIND item.areaRelations AS id_legacy_ntb',
    'MATCH (a2:Area {id_legacy_ntb:id_legacy_ntb})',
    'MERGE (a1)-[:LOCATED_IN]->(a2)',
  ].join('\n');

  performance.mark('a');
  await handler.session.run(query, {
    items: handler.areas.filter((a) => a.areaRelations.length),
  });
  performance.mark('b');
  handler.printDone();
};


const process = async (handler) => {
  console.log('- Processing areas');

  handler.areas = mapData(handler);
  await deleteUnknownAreas(handler);
  await mergeAreas(handler);
  await deleteUnkownCountyRelations(handler);
  await mergeCountyRelations(handler);
  await deleteUnkownMunicipalityRelations(handler);
  await mergeMunicipalityRelations(handler);
  await deleteUnkownAreaToAreaRelations(handler);
  await mergeAreaToAreaRelations(handler);
};


module.exports = process;

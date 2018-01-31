// @flow

import { performance } from 'perf_hooks'; // eslint-disable-line

import {
  createLogger,
  startDuration,
  endDuration,
} from '@turistforeningen/ntb-shared-utils';
import { run } from '@turistforeningen/ntb-shared-neo4j-utils';

import type { handlerObj } from '../lib/flow-types';
import legacy from '../legacy-structure/legacy';


const logger = createLogger();


function mapData(handler): void {
  const areas = handler.documents['områder'].map((d) => {
    return legacy.områder.mapping(d, handler);
  });

  handler.areas = areas;
}


async function findAreaIdsToDelete(handler: handlerObj): Promise<string[]> {
  logger.info('Fetching current areas');

  const durationId = startDuration();
  const query = 'MATCH (a:Area) RETURN a.id_legacy_ntb';
  const { session } = handler;
  const result = await run(session, query);

  endDuration(durationId);

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

  logger.info(`Found ${idsToDelete.length} unknown areas`);

  return idsToDelete;
}


async function deleteUnknownAreas(handler): Promise<void> {
  logger.info('Identifying unknown areas in Neo4j');
  const idsToDelete = await findAreaIdsToDelete(handler);

  if (idsToDelete.length) {
    logger.info('Delete old areas');
    const query = [
      'MATCH (a:Area)',
      'WHERE a.id_legacy_ntb IN $ids',
      'DETACH DELETE a',
    ].join('\n');

    await run(handler.session, query, { ids: idsToDelete });
  }
}


async function mergeAreas(handler): Promise<void> {
  logger.info('Adding/updating areas');
  const query = [
    'UNWIND $items as item',
    'MERGE (a:Area {id_legacy_ntb:item.area.id_legacy_ntb})',
    'ON CREATE SET a = item.area',
    'ON MATCH SET a = item.area',
  ].join('\n');

  await run(handler.session, query, { items: handler.areas });
}


async function findCountyRelationsToDelete(handler): Promise<string[]> {
  logger.info('Fetching current (Area)-->(County) relations');
  const query = [
    'MATCH (a:Area)-[:LOCATED_IN]->(c:County)',
    'RETURN a.id_legacy_ntb, c.uuid',
  ].join('\n');

  const result = await run(handler.session, query);

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

  logger.info(`Found ${relationsToDelete.length} unknown relations`);

  return relationsToDelete;
}


const deleteUnkownCountyRelations = async (handler) => {
  logger.info('Identifying unknown (Area)-->(County) relations');
  const relationsToDelete = await findCountyRelationsToDelete(handler);

  if (relationsToDelete.length) {
    logger.info('Delete old (Area)-->(County) relations ');
    const query = [
      'UNWIND $items as item',
      'MATCH (a:Area)-[r:LOCATED_IN]->(c:County)',
      'WHERE a.id_legacy_ntb = item.id_legacy_ntb',
      '      AND c.uuid = item.uuid',
      'DELETE r',
    ].join('\n');

    await run(handler.session, query, { items: relationsToDelete });
  }
};


const mergeCountyRelations = async (handler) => {
  logger.info('Adding/updating (Area)-->(County) relations');
  const query = [
    'UNWIND $items as item',
    'MATCH (a:Area {id_legacy_ntb:item.area.id_legacy_ntb})',
    'WITH a, item',
    'UNWIND item.counties AS uuid',
    'MATCH (c:County {uuid:uuid})',
    'MERGE (a)-[:LOCATED_IN]->(c)',
  ].join('\n');

  await run(handler.session, query, {
    items: handler.areas.filter((a) => a.counties.length),
  });
};


const findMunicipalityRelationsToDelete = async (handler) => {logger.info
  logger.info('Fetching current (Area)-->(Municipality) relations');
  const query = [
    'MATCH (a:Area)-[:LOCATED_IN]->(m:Municipality)',
    'RETURN a.id_legacy_ntb, m.uuid',
  ].join('\n');

  const result = await run(handler.session, query);

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

  logger.info(`Found ${relationsToDelete.length} unknown relations`);

  return relationsToDelete;
};


const deleteUnkownMunicipalityRelations = async (handler) => {
  logger.info('Identifying unknown (Area)-->(Municipality) relations');
  const relationsToDelete = await findMunicipalityRelationsToDelete(handler);

  if (relationsToDelete.length) {
    logger.info('Delete old (Area)-->(Municipality) relations ');
    const query = [
      'UNWIND $items as item',
      'MATCH (a:Area)-[r:LOCATED_IN]->(m:Municipality)',
      'WHERE a.id_legacy_ntb = item.id_legacy_ntb',
      '      AND m.uuid = item.uuid',
      'DELETE r',
    ].join('\n');

    await run(handler.session, query, { items: relationsToDelete });
  }
};


const mergeMunicipalityRelations = async (handler) => {
  logger.info('Adding/updating (Area)-->(Municipality) relations');
  const query = [
    'UNWIND $items as item',
    'MATCH (a:Area {id_legacy_ntb:item.area.id_legacy_ntb})',
    'WITH a, item',
    'UNWIND item.municipalities AS uuid',
    'MATCH (m:Municipality {uuid:uuid})',
    'MERGE (a)-[:LOCATED_IN]->(m)',
  ].join('\n');

  await run(handler.session, query, {
    items: handler.areas.filter((a) => a.municipalities.length),
  });
};


const findAreaToAreaRelationsToDelete = async (handler) => {
  logger.info('Fetching current (Area)-->(Area) relations');
  const query = [
    'MATCH (a1:Area)-[:LOCATED_IN]->(a2:Area)',
    'RETURN a1.id_legacy_ntb, a2.id_legacy_ntb',
  ].join('\n');

  const result = await run(handler.session, query);

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

  logger.info(`Found ${relationsToDelete.length} unknown relations`);

  return relationsToDelete;
};


const deleteUnkownAreaToAreaRelations = async (handler) => {logger.info
  logger.info('Identifying unknown (Area)-->(Area) relations');
  const relationsToDelete = await findAreaToAreaRelationsToDelete(handler);

  if (relationsToDelete.length) {
    logger.info('Delete old (Area)-->(Area) relations ');
    const query = [
      'UNWIND $items as item',
      'MATCH (a1:Area)-[r:LOCATED_IN]->(a2:Area)',
      'WHERE a1.id_legacy_ntb = item.a1',
      '      AND a2.id_legacy_ntb = item.a2',
      'DELETE r',
    ].join('\n');

    await run(handler.session, query, { items: relationsToDelete });
  }
};


const mergeAreaToAreaRelations = async (handler) => {
  logger.info('Adding/updating (Area)-->(Area) relations');
  const query = [
    'UNWIND $items as item',
    'MATCH (a1:Area {id_legacy_ntb:item.area.id_legacy_ntb})',
    'WITH a1, item',
    'UNWIND item.areaRelations AS id_legacy_ntb',
    'MATCH (a2:Area {id_legacy_ntb:id_legacy_ntb})',
    'MERGE (a1)-[:LOCATED_IN]->(a2)',
  ].join('\n');

  await run(handler.session, query, {
    items: handler.areas.filter((a) => a.areaRelations.length),
  });
};


const process = async (handler: handlerObj) => {
  logger.info('Processing areas');

  mapData(handler);
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

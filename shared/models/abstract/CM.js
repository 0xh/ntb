// @flow

import { performance } from 'perf_hooks'; // eslint-disable-line

import {
  printDone,
  createLogger,
  printNeo4jStats,
} from '@turistforeningen/ntb-shared-utils';
import { run } from '@turistforeningen/ntb-shared-neo4j-utils';


const logger = createLogger();

// ######################################
// Flow types
// ######################################

type statuses = 'draft' | 'public' | 'private' | 'deleted';

export type CM$data = {
  name: string,
  uuid: string,
  code: string,
  status: statuses,
  data_source?: string,
}

export type CM$translationItem = {
  uuid: string,
  name: string,
  name_lowercase: string,
  language: string,
  data_source?: string,
}

export type CM$translationData = {
  [key: string]: CM$translationItem
}


// ######################################
// Predicate functions
// ######################################

/**
 * Makes sure the value is a string
 */
function isString(value): %checks {
  return typeof value === 'string' || value instanceof String;
}

/**
 * Makes sure the CM status is valid
 */
function isValidStatus(status): %checks {
  return (
    status === 'draft' ||
    status === 'public' ||
    status === 'deleted' ||
    status === 'private'
  );
}

// ######################################
// Model
// ######################################

/**
 * All of Norways counties.
 */
class CM {
  data: {
    name: string,
    name_lowercase: string,
    uuid: string,
    code: string,
    status: statuses,
    data_source?: string,
  }

  translations: CM$translationData;

  /**
   * Instantiate CM
   */
  constructor(data: CM$data) {
    const name = data.name.trim();

    this.data = {
      name,
      name_lowercase: name.toLowerCase(),
      uuid: data.uuid.trim(),
      code: data.code.trim(),
      status: data.status,
      data_source: data.data_source,
    };

    this.translations = {};
  }

  /**
   * Set a name for the CM in a different language
   */
  setTranslation(languageCode: string, name: string) {
    this.translations[languageCode] = {
      uuid: this.data.uuid,
      name,
      name_lowercase: name.toLowerCase(),
      language: languageCode,
      data_source: this.data.data_source,
    };
  }

  /**
   * Find a list of counties or municipalities that matches the search string.
   * Only complete name matches, and search is done in lowercase.
   * If no match is found, `null` is returned.
   */
  static async _findByName(
    label: string,
    session: neo4j$session,
    search: string
  ): Promise<?CM[]> {
    // Execute query towards Neo4j
    const query = [
      `MATCH (n:${label} {name_lowercase:$name})`,
      'RETURN n {.name, .uuid, .code, .status}',
    ].join('\n');

    const result = await run(session, query, { name: search.toLowerCase() });
    if (!result.records.length) {
      return null;
    }

    // Loop through and verify the results
    const objects = [];
    result.records.forEach((r) => {
      const {
        uuid,
        name,
        code,
        status,
      } = r.get(0);

      if (
        isString(uuid) &&
        isString(name) &&
        isString(code) &&
        isValidStatus(status)
      ) {
        objects.push(new CM({
          uuid,
          name,
          code,
          status,
        }));
      }
      // Report on invalid matches
      else {
        console.error(`Found an invalid ${label} object`);
        console.error(JSON.stringify({
          uuid,
          name,
          code,
          status,
        }));
      }
    });

    return objects;
  }

  /**
   * Return Cypher query for creating a CM-node
   */
  static _getMergeQuery(label: string): string {
    return [
      `MERGE (c:${label} {uuid:item.uuid})`,
      'ON CREATE SET c = item',
      'ON MATCH SET c = item',
    ].join('\n');
  }

  /**
   * Return Cypher query for creating a CMTranslation-node with relation
   */
  static _getMergeTranslationQuery(label: string): string {
    return [
      `MATCH (c:${label} {uuid:item.uuid})`,
      `MERGE (t:${label}Translation {uuid:item.uuid})`,
      'ON CREATE SET t = item',
      'ON MATCH SET t = item',
      'MERGE (t)-[:TRANSLATION {language:item.language}]->(c)',
    ].join('\n');
  }

  /**
   * Given av data source name, all nodes not present in the array of uuids
   * will be detach-deleted.
   */
  static async _deleteUnknownFromDataSource(
    session: neo4j$session,
    dataSource: string,
    uuids: string[],
    label: string,
  ): Promise<void> {
    logger.info(
      `Deleting deprecated nodes (${label}) from datasource "${dataSource}"`
    );

    const query = [
      `MATCH (n:${label} {data_source:$data_source})`,
      'WHERE NOT n.uuid IN $uuids',
      'DETACH DELETE (n)',
    ].join('\n');

    await run(session, query, {
      data_source: dataSource,
      uuids,
    });
  }

  /**
   * Merge all items into nodes
   */
  static async _mergeAllNodes(
    session: neo4j$session,
    items: CM$data[],
    label: string
  ): Promise<void> {
    const query = [
      'UNWIND $items AS item',
      CM._getMergeQuery(label),
    ].join('\n');

    logger.info(`Merging ${items.length} ${label} nodes`);
    await run(session, query, { items });
  }

  /**
   * Merge all items into nodes and remove deprecated translations
   */
  static async _mergeAllNodeTranslations(
    session: neo4j$session,
    items: CM$translationItem[],
    label: string
  ): Promise<void> {
    // Create trabnslation nodes
    let query = [
      'UNWIND $items AS item',
      CM._getMergeTranslationQuery(label),
    ].join('\n');

    logger.info(`Merging ${items.length} ${label}Translation nodes`);
    await run(session, query, { items });

    // Delete translations on objects that does not have any translations
    logger.info(`Deleting deprecated translations for ${label} in DB (1/2)`);
    query = [
      `MATCH (c:${label})-[r:TRANSLATION]-(x:${label}Translation)`,
      'WHERE NOT c.uuid IN $uuids',
      'DETACH DELETE x',
    ].join('\n');
    const uuids = items.map((i) => i.uuid);
    await run(session, query, { uuids });

    // Delete translations on objects that does not have any translations
    logger.info(`Deleting deprecated translations for ${label} in DB (2/2)`);
    query = [
      'UNWIND $refs AS ref',
      `MATCH (c:${label})-[r:TRANSLATION]-(x:${label}Translation)`,
      'WHERE c.uuid = ref.uuid',
      '      AND NOT r.language IN ref.languages',
      'DETACH DELETE x',
    ].join('\n');

    const refs: {
      [key: string]: {
        languages: string[],
        uuid: string,
      }
    } = {};
    items.forEach((i) => {
      if (!refs[i.uuid]) {
        refs[i.uuid] = { languages: [], uuid: i.uuid };
      }
      refs[i.uuid].languages.push(i.language);
    });
    await run(session, query, { refs: Object.values(refs) });
  }
}


export default CM;

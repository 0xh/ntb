// @flow

import { performance } from 'perf_hooks'; // eslint-disable-line

import { createLogger } from '@turistforeningen/ntb-shared-utils';
import { run } from '@turistforeningen/ntb-shared-neo4j-utils';
import CM from './abstract/CM';
import type { CM$translationItem } from './abstract/CM';
import County from './County';


const logger = createLogger();


// ######################################
// Flow types
// ######################################


// ######################################
// Predicate functions
// ######################################


// ######################################
// Model
// ######################################

/**
 * All of Norways municipalities.
 */
class Municipality extends CM {
  locatedIn: County;

  /**
   * Add LOCATED_IN relation to county
   */
  setLocatedIn(county: County): void {
    this.locatedIn = county;
  }

  /**
   * Find a list of municipalities that matches the search string. Only
   * complete name matches, and search is done in lowercase.
   * If no match is found, `null` is returned.
   */
  static findByName(
    session: neo4j$session,
    search: string
  ): Promise<?CM[]> {
    return super._findByName('Municipality', session, search);
  }

  /**
   * Return a list of all Municipalities
   */
  static findAll(session: neo4j$session): Promise<?CM[]> {
    return super._findAll('Municipality', session);
  }

  /**
   * Save multiple municipalities
   */
  static async saveAll(
    session: neo4j$session,
    municipalities: Municipality[],
    deleteUnknownFromDataSource: ?string,
  ): Promise<void> {
    logger.info(`Saving ${municipalities.length} nodes (Municipality)`);

    // Delete nodes from same data source which no longer exist in the incoming
    // dataset.
    if (deleteUnknownFromDataSource) {
      const uuids = municipalities.map((c) => c.data.uuid);
      await Municipality._deleteUnknownFromDataSource(
        session,
        deleteUnknownFromDataSource,
        uuids,
        'Municipality'
      );
    }

    // Create (merge) Municipalities
    const municipalitiesData = municipalities.map((c) => c.data);
    await this._mergeAllNodes(session, municipalitiesData, 'Municipality');

    // Create (merge) MunicipalityTranslations
    let translationItems: CM$translationItem[] = [];
    municipalities.forEach((c) => {
      if (Object.keys(c.translations).length) {
        Object.keys(c.translations).forEach((key) => {
          const i = c.translations[key];
          translationItems = translationItems.concat([i]);
        });
      }
    });
    if (translationItems.length) {
      await this._mergeAllNodeTranslations(
        session,
        translationItems,
        'Municipality'
      );
    }

    // Create county located in relations
    await this._saveAllLocatedInRelations(session, municipalities);
  }

  static async _saveAllLocatedInRelations(
    session: neo4j$session,
    municipalities: Municipality[],
  ): Promise<void> {
    let query: string;
    const items: Array<{
      county: string,
      municipality: string,
    }> = [];

    municipalities.forEach((m) => {
      if (m.locatedIn) {
        items.push({
          county: m.locatedIn.data.uuid,
          municipality: m.data.uuid,
        });
      }
    });

    if (municipalities) {
      logger.info(
        'Saving (Municipality)-[:LOCATED_IN]->(County) relations' +
        'and removing any deprecated relations'
      );
      query = [
        'UNWIND $items AS item',
        'MATCH (c:County {uuid:item.county}),',
        '      (m:Municipality {uuid:item.municipality})',
        'MATCH (m)-[r:LOCATED_IN]->(unknown:County)',
        'WHERE unknown <> c',
        'DELETE r',
        'MERGE (m)-[:LOCATED_IN]->(c)',
      ].join('\n');
      await run(session, query, { items });
    }
  }
}


export default Municipality;

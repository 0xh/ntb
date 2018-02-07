// @flow

import { performance } from 'perf_hooks'; // eslint-disable-line

import { createLogger } from '@turistforeningen/ntb-shared-utils';
import CM from './abstract/CM';
import type { CM$translationItem } from './abstract/CM';


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
 * All of Norways counties.
 */
class County extends CM {
  /**
   * Find a list of counties that matches the search string. Only complete
   * name matches, and search is done in lowercase.
   * If no match is found, `null` is returned.
   */
  static findByName(
    session: neo4j$session,
    search: string
  ): Promise<?CM[]> {
    return super._findByName('County', session, search);
  }

  /**
   * Return a list of all Counties
   */
  static findAll(session: neo4j$session): Promise<?CM[]> {
    return super._findAll('County', session);
  }

  /**
   * Save multiple counties
   */
  static async saveAll(
    session: neo4j$session,
    counties: County[],
    deleteUnknownFromDataSource: ?string,
  ): Promise<void> {
    logger.info(`Saving ${counties.length} nodes (County)`);

    // Delete nodes from same data source which no longer exist in the incoming
    // dataset.
    if (deleteUnknownFromDataSource) {
      const uuids = counties.map((c) => c.data.uuid);
      await County._deleteUnknownFromDataSource(
        session,
        deleteUnknownFromDataSource,
        uuids,
        'County'
      );
    }

    // Create (merge) Counties
    const countiesData = counties.map((c) => c.data);
    await this._mergeAllNodes(session, countiesData, 'County');

    // Create (merge) CountyTranslations
    let translationItems: CM$translationItem[] = [];
    counties.forEach((c) => {
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
        'County'
      );
    }
  }
}


export default County;

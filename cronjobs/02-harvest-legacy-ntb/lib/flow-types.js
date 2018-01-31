// @flow

import type { models$CM } from '@turistforeningen/ntb-shared-models';


export type legacyTypes =
  'områder' | 'lister' | 'grupper' | 'steder' | 'turer' | 'bilder';

export type legacyDocuments = {
  [key: legacyTypes]: Array<any>,
}

export type handlerObj = {
  documents?: legacyDocuments,
  counties?: ?models$CM[],
  municipalities?: ?models$CM[],
  session?: neo4j$session,

  areas?: {},
}

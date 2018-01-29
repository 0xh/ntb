// @flow

import { performance } from 'perf_hooks'; // eslint-disable-line
import { v1 as neo4j } from 'neo4j-driver';
import uuid4 from 'uuid/v4';

import {
  printDone,
  printNeo4jStats,
} from '@turistforeningen/ntb-shared-utils';
import {
  NEO4J_URI,
  NEO4J_USER,
  NEO4J_PASSWORD,
} from '@turistforeningen/ntb-shared-settings';


export const createDriver = () =>
  neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(
      NEO4J_USER,
      NEO4J_PASSWORD
    )
  );


export const createSession = (driver: neo4j$driver): neo4j$session =>
  driver.session();


export async function run(
  session: neo4j$session,
  query: string,
  parameters?: {
    [key: string]: mixed,
  }
): Promise<neo4j$result> {
  const m1 = uuid4();
  const m2 = uuid4();
  performance.mark(m1);
  const result = await session.run(query, parameters);
  performance.mark(m2);
  printDone(m1, m2);
  printNeo4jStats(result);

  return result;
}

// @flow

declare type ObjMap<T> = { [key: string]: T, __proto__: null };

declare type neo4j$resultRecord = {
  keys: string[],
  length: number,
  _fields: mixed[],
  _fieldLookup: {
    "n": 0
  },
  get(key: string | number): ObjMap<?(string | number)>,
}


declare type neo4j$result = {
  records: neo4j$resultRecord[],
  summary: {
    statement: {
      text: string,
      parameters: { [key: string]: mixed }
    },
    statementType: mixed,
    counters: {
      nodesCreated: () => number,
      nodesDeleted: () => number,
      relationshipsCreated: () => number,
      relationshipsDeleted: () => number,
      propertiesSet: () => number,
      labelsAdded: () => number,
      labelsRemoved: () => number,
      indexesAdded: () => number,
      indexesRemoved: () => number,
      constraintsAdded: () => number,
      constraintsRemoved: () => number,
    },
    plan: false,
    profile: false,
    notifications: mixed[],
    server: {
      address: string,
      version: string,
    },
    resultConsumedAfter: {
      low: number,
      high: number
    },
    resultAvailableAfter: {
      low: number,
      high: number
    }
  }
};


declare type neo4j$session = {
  run(
    query: string,
    parameters?: {[key: string]: mixed},
  ): Promise<neo4j$result>,
  close(): void,
};


declare type neo4j$driver = {
  close(): void,
  session(): neo4j$session,
};


declare module 'neo4j-driver' {
  declare type neo4j$authBasic = mixed;

  declare function driver(uri: string, auth: neo4j$authBasic) : string;

  declare function authBasic(user: string, password: string): neo4j$authBasic;

  declare type neo4j$auth = {
    basic: authBasic,
  };

  declare type neo4j$v1 = {
    driver: driver,
    auth: neo4j$auth,
  };

  declare module.exports: {
    v1: neo4j$v1,
  };
}

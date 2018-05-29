import _ from 'lodash';

import { isObject, isString } from '@turistforeningen/ntb-shared-utils';
import { knex } from '@turistforeningen/ntb-shared-db-utils';
import { BaseModel } from '@turistforeningen/ntb-shared-models';


function addJoins(queryInstance, model, modelAlias, queryOptions) {
  let query = queryInstance;
  const relations = model.getRelations();
  queryOptions.relations.forEach((relationOptions) => {
    const { relationKey } = relationOptions;
    const relation = relations[relationKey];

    // Join the through table if set
    if (relation.joinTable) {
      query = query.leftJoin(
        `${relation.joinTable}`,
        function joinFn() {
          const join = this;

          // Filter from model table to related table
          relation.ownerProp.props.forEach((modelProp, idx) => {
            const joinProp = relation.joinTableOwnerProp.props[idx];
            const mProp = `${modelAlias}."${modelProp}"`;
            const jProp = `${relation.joinTable}."${joinProp}"`;
            join.on(mProp, '=', jProp);
          });
        }
      );
    }

    query = query.leftJoin(
      `${relation.relatedModelClass.tableName} as ${relationKey}`,
      function joinFn() {
        const join = this;

        // Join with the through table if set
        if (relation.joinTable) {
          relation.joinTableRelatedProp.props.forEach((joinProp, idx) => {
            const relatedProp = relation.relatedProp.props[idx];
            const jProp = `${relation.joinTable}."${joinProp}"`;
            const rProp = `${relationKey}."${relatedProp}"`;
            join.on(jProp, '=', rProp);
          });
        }
        // Join from model table to related table
        else {
          relation.ownerProp.props.forEach((modelProp, idx) => {
            const relatedProp = relation.relatedProp.props[idx];
            const mProp = `${modelAlias}."${modelProp}"`;
            const rProp = `${relationKey}."${relatedProp}"`;
            join.on(mProp, '=', rProp);
          });
        }
      }
    );
  });

  return query;
}


function setFilters(queryInstance, modelAlias, baseFilters) {
  const and = !!baseFilters.$and;
  const filters = baseFilters.$and || baseFilters.$or;
  const baseWhere = and ? 'where' : 'orWhere';

  const query = queryInstance[baseWhere](function whereFn() {
    const w = this;
    filters.forEach((filter) => {
      if (filter.$and || filter.$or) {
        w[baseWhere](function nestedWhereFn() {
          setFilters(this, modelAlias, filter);
        });
      }
      else {
        const whereType = filter.whereType.replace('where', baseWhere);
        const modelRef = whereType.endsWith('Raw')
          ? _.snakeCase(modelAlias)
          : modelAlias;
        const options = filter.options
          .map((o) => (
            isString(o) ? o.replace('[[MODEL-TABLE]]', modelRef) : o
          ));
        w[whereType](...options);
      }
    });
  });

  return query;
}


function findIdentifiersForThroughRelations(relation, outerInstances) {
  // Find identifiers from outer instances
  let identifiersFound = false;
  const identifiersByProp = {};

  relation.ownerProp.props.forEach((ownerTableProp, idx) => {
    identifiersByProp[ownerTableProp] = outerInstances
      .map((i) => i[ownerTableProp])
      .filter((i) => i);

    if (identifiersByProp[ownerTableProp].length) {
      identifiersFound = true;
    }
  });

  return [identifiersFound, identifiersByProp];
}


function findIdentifiersForRelations(ownerIdColumns, outerInstances) {
  // Find identifiers from outer instances
  let identifiersFound = false;
  const identifiersByProp = {};

  ownerIdColumns.forEach((ownerTableProp, idx) => {
    identifiersByProp[ownerTableProp] = outerInstances
      .map((i) => i[ownerTableProp])
      .filter((i) => i);

    if (identifiersByProp[ownerTableProp].length) {
      identifiersFound = true;
    }
  });

  return [identifiersFound, identifiersByProp];
}


function createMultiThroughSubQuery(handler, joinOnOuter = true) {
  const { relation, model } = handler;

  // Create sub query
  let query = model.query().alias('inner');

  // Join through table
  query = query.innerJoin(relation.joinTable, function joinFn() {
    const join = this;

    // Filter on inner and join table attributes
    relation.relatedProp.props.forEach((modelProp, idx) => {
      const joinTableProp = relation.joinTableRelatedProp.props[idx];
      const mProp = `"inner".${modelProp}`;
      const jProp = `${relation.joinTable}.${joinTableProp}`;
      join.on(mProp, '=', jProp);
    });

    // Filter from join table to outer table
    if (joinOnOuter) {
      relation.ownerProp.props.forEach((modelProp, idx) => {
        const joinTableProp = relation.joinTableOwnerProp.props[idx];
        const mProp = `"outer".${modelProp}`;
        const jProp = `${relation.joinTable}.${joinTableProp}`;
        join.on(mProp, '=', jProp);
      });
    }
  });

  return query;
}


function createPaginatedMultiThroughMainQuery(handler, identifiersByProp) {
  const { queryOptions, relation } = handler;

  // Create sub query
  let subQuery = createMultiThroughSubQuery(handler, true);

  // Attributes to select
  if (queryOptions.attributes) {
    const extras = {};

    (relation.joinTableExtras || []).forEach((e) => {
      extras[e.aliasProp] = e.joinTableCol;
    });
    const attrs = queryOptions.attributes
      .map((a) => {
        if (Object.keys(extras).includes(a)) {
          return `${relation.joinTable}.${extras[a]} AS ${a}`;
        }
        return `inner.${a}`;
      });
    subQuery = subQuery.select(...attrs);
  }

  // Set ordering
  if (queryOptions.order && queryOptions.order.length) {
    queryOptions.order.forEach((order) => {
      subQuery = subQuery.orderBy(order[0], order[1]);
    });
  }

  // Set limit
  if (queryOptions.limit) {
    subQuery = subQuery.limit(queryOptions.limit);
  }

  // Set offset
  if (queryOptions.offset) {
    subQuery = subQuery.offset(queryOptions.offset);
  }


  // Set primary query select attributes
  const attributes = relation.ownerProp.props
    .map((p, idx) => `outer.${p} AS outerId${idx}`);

  // Create primary query
  let query = knex.select([...attributes, `${relation.name}.*`]);

  // From
  query = query.from({ outer: relation.ownerModelClass.tableName });

  // Join lateral subquery
  query = query.joinRaw(
    `CROSS JOIN LATERAL (?) "${_.snakeCase(relation.name)}"`,
    knex.raw(subQuery)
  );

  // Filter on outer identifiers
  Object.keys(identifiersByProp).forEach((p) => {
    const identifiers = identifiersByProp[p];
    if (!identifiers.length) {
      query = query.whereNull(`outer.${p}`);
    }
    else {
      query = query.whereIn(`outer.${p}`, identifiers);
    }
  });

  return query;
}


function createMultiThroughMainQuery(handler, identifiersByProp) {
  const { queryOptions, relation } = handler;

  // Create query
  let query = createMultiThroughSubQuery(handler, false);

  // Attributes to select
  if (queryOptions.attributes) {
    const extras = {};

    (relation.joinTableExtras || []).forEach((e) => {
      extras[e.aliasProp] = e.joinTableCol;
    });
    const attrs = queryOptions.attributes
      .map((a) => {
        if (Object.keys(extras).includes(a)) {
          return `${relation.joinTable}.${extras[a]} AS ${a}`;
        }
        return `inner.${a}`;
      });
    query = query.select(...attrs);
  }

  // Join on outer instances attributes
  const ownerAttributes = relation.joinTableOwnerProp.props
    .map((p, idx) => `${relation.joinTable}.${p} AS outerId${idx}`);
  query = query.select(...ownerAttributes);

  // Set ordering
  if (queryOptions.order && queryOptions.order.length) {
    queryOptions.order.forEach((order) => {
      query = query.orderBy(order[0], order[1]);
    });
  }

  // Set limit
  if (queryOptions.limit) {
    query = query.limit(queryOptions.limit);
  }

  // Set offset
  if (queryOptions.offset) {
    query = query.offset(queryOptions.offset);
  }


  // Filter on outer identifiers
  Object.keys(identifiersByProp).forEach((ownerProp) => {
    // Find the index of ownerProp
    const idx = relation.ownerProp.props.indexOf(ownerProp);

    // Map index to same index of join table
    const prop = relation.joinTableOwnerProp.props[idx];

    const identifiers = identifiersByProp[ownerProp];
    if (!identifiers.length) {
      query = query.whereNull(`${relation.joinTable}.${prop}`);
    }
    else {
      query = query.whereIn(`${relation.joinTable}.${prop}`, identifiers);
    }
  });

  return query;
}


function createPaginatedMultiThroughCountQuery(handler, identifiersByProp) {
  const { relation } = handler;

  // Create query
  let query = createMultiThroughSubQuery(handler, false);

  const groupByProps = relation.joinTableOwnerProp.props
    .map((p) => `${relation.joinTable}.${p}`);
  const selectProps = groupByProps
    .map((p, idx) => `${p} AS outerId${idx}`);

  query = query
    .select(...selectProps, knex.raw('COUNT(*) AS count'))
    .groupBy(groupByProps);

  // Filter on outer identifiers
  Object.keys(identifiersByProp).forEach((ownerProp) => {
    // Find the index of ownerProp
    const idx = relation.ownerProp.props.indexOf(ownerProp);

    // Map index to same index of join table
    const prop = relation.joinTableOwnerProp.props[idx];

    const identifiers = identifiersByProp[ownerProp];
    if (!identifiers.length) {
      query = query.whereNull(`${relation.joinTable}.${prop}`);
    }
    else {
      query = query.whereIn(`${relation.joinTable}.${prop}`, identifiers);
    }
  });

  return query;
}


function createPaginatedMultiMainQuery(handler, identifiersByProp) {
  const { queryOptions, model, relation } = handler;

  let subQuery = model.query().alias('inner');

  // Attributes to select
  if (queryOptions.attributes) {
    const attrs = queryOptions.attributes
      .map((a) => `"inner".${a}`);
    subQuery = subQuery.select(...attrs);
  }

  // Filter on ids from outer table
  relation.relatedProp.props.forEach((modelProp, idx) => {
    const joinTableProp = relation.ownerProp.props[idx];
    const mProp = `"inner"."${_.snakeCase(modelProp)}"`;
    const jProp = `"outer"."${_.snakeCase(joinTableProp)}"`;
    subQuery.whereRaw(`${mProp} = ${jProp}`);
  });

  // Set ordering
  if (queryOptions.order && queryOptions.order.length) {
    queryOptions.order.forEach((order) => {
      subQuery = subQuery.orderBy(order[0], order[1]);
    });
  }

  // Set limit
  if (queryOptions.limit) {
    subQuery = subQuery.limit(queryOptions.limit);
  }

  // Set offset
  if (queryOptions.offset) {
    subQuery = subQuery.offset(queryOptions.offset);
  }

  // Create primary query
  const ownerAttributes = relation.ownerProp.props.map((p, idx) => (
    `"outer"."${p}" AS outerId${idx}`
  ));
  let query = knex.select([...ownerAttributes, `${relation.name}.*`]);

  // From
  query = query.from({ outer: relation.ownerModelClass.tableName });

  // Join lateral subquery
  query = query.joinRaw(
    `CROSS JOIN LATERAL (?) "${_.snakeCase(relation.name)}"`,
    knex.raw(subQuery)
  );

  // Filter on outer identifiers
  Object.keys(identifiersByProp).forEach((p) => {
    const identifiers = identifiersByProp[p];
    if (!identifiers.length) {
      query = query.whereNull(`outer.${p}`);
    }
    else {
      query = query.whereIn(`outer.${p}`, identifiers);
    }
  });

  return query;
}


function createPaginatedMultiCountQuery(handler, identifiersByProp) {
  const { relation, model } = handler;

  // Create query
  let query = knex(`${model.tableName} as "inner"`);

  // Join owner table
  query = query.innerJoin(
    `${relation.ownerModelClass.tableName} as "outer"`,
    function joinFn() {
      const join = this;

      // Filter from inner table to outer table
      relation.ownerProp.props.forEach((modelProp, idx) => {
        const innerProp = relation.relatedProp.props[idx];
        const mProp = `"outer"."${modelProp}"`;
        const iProp = `"inner"."${innerProp}"`;
        join.on(mProp, '=', iProp);
      });
    }
  );

  const groupByProps = relation.ownerProp.props
    .map((p) => `"outer".${p}`);
  const selectProps = groupByProps
    .map((p, idx) => `${p} AS outerId${idx}`);

  query = query
    .select(...selectProps, knex.raw('COUNT(*) AS count'))
    .groupBy(groupByProps);

  // Filter on outer identifiers
  Object.keys(identifiersByProp).forEach((ownerProp) => {
    const identifiers = identifiersByProp[ownerProp];
    if (!identifiers.length) {
      query = query.whereNull(`"outer".${ownerProp}`);
    }
    else {
      query = query.whereIn(`"outer".${ownerProp}`, identifiers);
    }
  });

  return query;
}


async function executePaginatedMultiThroughRelation(
  handler,
  key,
  outerInstances
) {
  const { relation, queryOptions } = handler;
  const includeInstances = [];

  // Find identifiers from outer instances
  const [identifiersFound, identifiersByProp] =
    findIdentifiersForThroughRelations(relation, outerInstances);

  // Nothing to join on
  if (!identifiersFound) {
    return [];
  }

  // Create count query
  const promises = [
    createPaginatedMultiThroughCountQuery(
      handler, identifiersByProp
    ),
  ];

  // Add main query if limit > 1
  if (queryOptions.limit) {
    promises.push(createPaginatedMultiThroughMainQuery(
      handler, identifiersByProp
    ));
  }

  // Retrieve result
  const [counts, rows] = await Promise.all(promises);

  const baseOpts = {
    limit: handler.queryOptions.limit,
    offset: handler.queryOptions.offset,
  };

  // Map the rows to the include model
  (rows || []).forEach((row) => {
    // Find the main rows
    const outers = outerInstances
      .filter((instance) => (
        relation.ownerProp.props
          .map((p, idx) => instance[p] === row[`outerId${idx}`])
          .every((e) => e)
      ));
    if (!outers || !outers.length) {
      throw new Error('Unable to map include.row with outer.row');
    }

    const instance = relation.relatedModelClass
      .fromJson(row, { skipValidation: true });

    outers.forEach((outer) => {
      if (!outer[relation.name]) {
        outer[relation.name] = {
          ...baseOpts,
          rows: [],
          count: 0,
        };
      }

      outer[relation.name].rows.push(instance);
    });

    // Add instance for nested relations later
    includeInstances.push(instance);
  });

  // Map the counts to the include model
  counts.forEach((row) => {
    // Find the main rows
    const outers = outerInstances
      .filter((instance) => (
        relation.ownerProp.props
          .map((p, idx) => instance[p] === row[`outerId${idx}`])
          .every((e) => e)
      ));
    if (!outers || !outers.length) {
      throw new Error('Unable to map include.row with outer.row');
    }

    outers.forEach((outer) => {
      if (!outer[relation.name]) {
        outer[relation.name] = {
          ...baseOpts,
          rows: [],
          count: 0,
        };
      }

      outer[relation.name].count = +row.count;
    });
  });

  return includeInstances;
}


async function executeMultiThroughRelation(handler, key, outerInstances) {
  const { relation } = handler;
  const includeInstances = [];

  // Find identifiers from outer instances
  const [identifiersFound, identifiersByProp] =
    findIdentifiersForThroughRelations(relation, outerInstances);

  // Nothing to join on
  if (!identifiersFound) {
    return [];
  }

  // Retrieve result
  const rows = await createMultiThroughMainQuery(handler, identifiersByProp);

  // Map the rows to the include model
  (rows || []).forEach((row) => {
    // Find the main rows
    const outers = outerInstances
      .filter((instance) => (
        relation.ownerProp.props
          .map((p, idx) => instance[p] === row[`outerId${idx}`])
          .every((e) => e)
      ));
    if (!outers || !outers.length) {
      throw new Error('Unable to map include.row with outer.row');
    }

    const instance = relation.relatedModelClass
      .fromJson(row, { skipValidation: true });

    outers.forEach((outer) => {
      if (!outer[relation.name]) {
        outer[relation.name] = [];
      }

      outer[relation.name].push(instance);
    });

    // Add instance for nested relations later
    includeInstances.push(instance);
  });

  return includeInstances;
}


async function executeSingleOrMultiRelation(
  handler,
  key,
  outerInstances,
  isSingle
) {
  const { relation, model, queryOptions } = handler;
  const includeInstances = [];

  // Set owner table id columns
  const ownerTableName = relation.ownerModelClass.tableName;
  const ownerIdColumns = Array.isArray(relation.ownerModelClass.idColumn)
    ? relation.ownerModelClass.idColumn
    : [relation.ownerModelClass.idColumn];

  // Find identifiers from outer instances
  const [identifiersFound, identifiersByProp] =
    findIdentifiersForRelations(ownerIdColumns, outerInstances);

  // Nothing to join on
  if (!identifiersFound) {
    return [];
  }

  // Create query
  let query = model.query();

  // Attributes to select
  if (queryOptions.attributes) {
    const attrs = queryOptions.attributes
      .map((a) => `${model.tableName}.${a}`);
    query = query.select(...attrs);
  }

  // Select owner identifiers
  const ownerAttributes = ownerIdColumns.map((p, idx) => (
    `${ownerTableName}.${p} AS outerId${idx}`
  ));
  query = query.select(...ownerAttributes);

  // Join related table
  query = query.innerJoin(
    relation.ownerModelClass.tableName,
    function joinFn() {
      const join = this;

      // Filter on inner and join table attributes
      relation.relatedProp.props.forEach((modelProp, idx) => {
        const ownerProp = relation.ownerProp.props[idx];
        const mProp = `${model.tableName}.${modelProp}`;
        const rProp = `${ownerTableName}.${ownerProp}`;
        join.on(mProp, '=', rProp);
      });

      // Filter on outerInstace identifiers
      Object.keys(identifiersByProp).forEach((p) => {
        const identifiers = identifiersByProp[p];
        if (!identifiers.length) {
          join.onNull(`${ownerTableName}.${p}`);
        }
        else {
          join.onIn(`${ownerTableName}.${p}`, identifiers);
        }
      });
    }
  );

  // Add relations joins (for filters and eager loading)
  if (queryOptions.relations) {
    query = addJoins(query, model, model.tableName, queryOptions);
  }

  // Filters
  if (queryOptions.where) {
    query = setFilters(query, model.tableName, queryOptions.where);
  }

  // Set ordering
  if (queryOptions.order && queryOptions.order.length) {
    queryOptions.order.forEach((order) => {
      query = query.orderBy(order[0], order[1]);
    });
  }

  // Set limit
  if (queryOptions.limit) {
    query = query.limit(queryOptions.limit);
  }

  // Set offset
  if (queryOptions.offset) {
    query = query.offset(queryOptions.offset);
  }

  const rows = await query;

  rows.forEach((row) => {
    // Find the main rows
    const outers = outerInstances
      .filter((instance) => (
        ownerIdColumns
          .map((p, idx) => instance[p] === row[`outerId${idx}`])
          .every((e) => e)
      ));
    if (!outers || !outers.length) {
      throw new Error('Unable to map include.row with outer.row');
    }

    const instance = relation.relatedModelClass
      .fromJson(row, { skipValidation: true });

    outers.forEach((outer) => {
      if (!isSingle) {
        if (!outer[relation.name]) {
          outer[relation.name] = [];
        }
        outer[relation.name].push(instance);
      }
      else {
        outer[relation.name] = instance;
      }
    });

    // Add instance for nested relations later
    includeInstances.push(instance);
  });

  return includeInstances;
}


async function executePaginatedMultiRelation(handler, key, outerInstances) {
  const { relation, queryOptions } = handler;
  const includeInstances = [];

  // Set owner table id columns
  const ownerIdColumns = Array.isArray(relation.ownerModelClass.idColumn)
    ? relation.ownerModelClass.idColumn
    : [relation.ownerModelClass.idColumn];

  // Find identifiers from outer instances
  const [identifiersFound, identifiersByProp] =
    findIdentifiersForRelations(ownerIdColumns, outerInstances);

  // Nothing to join on
  if (!identifiersFound) {
    return [];
  }

  const promises = [
    createPaginatedMultiCountQuery(handler, identifiersByProp),
  ];

  if (queryOptions.limit) {
    promises.push(
      createPaginatedMultiMainQuery(handler, identifiersByProp)
    );
  }

  // Execute
  const [counts, rows] = await Promise.all(promises);


  const baseOpts = {
    limit: handler.queryOptions.limit,
    offset: handler.queryOptions.offset,
  };

  (rows || []).forEach((row) => {
    // Find the main rows
    const outers = outerInstances
      .filter((instance) => (
        ownerIdColumns
          .map((p, idx) => instance[p] === row[`outerId${idx}`])
          .every((e) => e)
      ));
    if (!outers || !outers.length) {
      throw new Error('Unable to map include.row with outer.row');
    }

    const instance = relation.relatedModelClass
      .fromJson(row, { skipValidation: true });

    outers.forEach((outer) => {
      if (!outer[relation.name]) {
        outer[relation.name] = {
          ...baseOpts,
          rows: [],
          count: 0,
        };
      }

      outer[relation.name].rows.push(instance);
    });

    // Add instance for nested relations later
    includeInstances.push(instance);
  });

  counts.forEach((count) => {
    // Find the main rows
    const outers = outerInstances
      .filter((instance) => (
        ownerIdColumns
          .map((p, idx) => instance[p] === count[`outerId${idx}`])
          .every((e) => e)
      ));
    if (!outers || !outers.length) {
      throw new Error('Unable to map include.row with outer.row');
    }

    outers.forEach((outer) => {
      if (!outer[relation.name]) {
        outer[relation.name] = {
          ...baseOpts,
          rows: [],
          count: 0,
        };
      }

      outer[relation.name].count = +count.count;
    });
  });

  return includeInstances;
}


async function executeRelationQueries(handler, outerInstances) {
  if (!Object.keys(handler.relations).length) {
    return;
  }

  await Promise.all(
    Object.keys(handler.relations).map(async (key) => {
      const relationHandler = handler.relations[key];
      let relationInstances;
      const { relation } = relationHandler;

      // Paginated relation to many using a through table
      if (
        relationHandler.config.paginate
        && relation instanceof BaseModel.ManyToManyRelation
        && !(relation instanceof BaseModel.HasOneThroughRelation)
      ) {
        relationInstances = await executePaginatedMultiThroughRelation(
          relationHandler, key, outerInstances,
        );
      }
      // Relation to many using a through table that is not paginated
      else if (
        !relationHandler.config.paginate
        && relation instanceof BaseModel.ManyToManyRelation
        && !(relation instanceof BaseModel.HasOneThroughRelation)
      ) {
        relationInstances = await executeMultiThroughRelation(
          relationHandler, key, outerInstances,
        );
      }
      // Single instance relation
      else if (relation instanceof BaseModel.BelongsToOneRelation) {
        relationInstances = await executeSingleOrMultiRelation(
          relationHandler, key, outerInstances, true
        );
      }
      // Relation to many not using av through table that is not paginated
      else if (
        !relationHandler.config.paginate
        && relation instanceof BaseModel.HasManyRelation
        && !(relation instanceof BaseModel.HasOneRelation)
      ) {
        relationInstances = await executeSingleOrMultiRelation(
          relationHandler, key, outerInstances, false
        );
      }
      // Paginated relation to many not using av through table
      else if (
        relationHandler.config.paginate
        && relation instanceof BaseModel.HasManyRelation
        && !(relation instanceof BaseModel.HasOneRelation)
      ) {
        relationInstances = await executePaginatedMultiRelation(
          relationHandler, key, outerInstances, false
        );
      }
      // else if (isSingleAssociation) {
      //   includeInstances = await executeSingleAssociation(
      //     handler, include, key, outerInstances
      //   );
      // }
      // else if (association.through) {
      //   includeInstances = await executeMultiThroughAssociation(
      //     handler, include, key, outerInstances
      //   );
      // }
      // else if (include.config.paginate && association.isMultiAssociation) {
      //   includeInstances = await executePaginatedMultiAssociation(
      //     handler, include, key, outerInstances
      //   );
      // }
      // else if (association.isMultiAssociation) {
      //   includeInstances = await executeMultiAssociation(
      //     handler, include, key, outerInstances
      //   );
      // }
      else {
        throw new Error(
          'Not yet implemented this kind of include association'
        );
      }

      // Recursive include
      const relatedRelations = Object.keys(relationHandler.relations).length;
      if (relatedRelations && relationInstances.length) {
        await executeRelationQueries(relationHandler, relationInstances);
      }
    })
  );
}


async function executeMainQueryPart(model, queryOptions, count = false) {
  let query = model.query();

  // Attributes to select if it's a count query
  if (count) {
    query = query.count({ count: '*' });
  }

  // Attributes to select if it's not a count query
  if (queryOptions.attributes && !count) {
    const attrs = queryOptions.attributes
      .map((a) => `${model.tableName}.${a}`);
    query = query.select(...attrs);
  }

  // Joins
  if (queryOptions.relations) {
    query = addJoins(query, model, model.tableName, queryOptions);
  }

  // Filters
  if (queryOptions.where) {
    query = setFilters(query, model.tableName, queryOptions.where);
  }

  // Set ordering
  if (queryOptions.order && queryOptions.order.length && !count) {
    queryOptions.order.forEach((order) => {
      query = query.orderBy(order[0], order[1]);
    });
  }

  // Set limit
  if (queryOptions.limit && !count) {
    query = query.limit(queryOptions.limit);
  }

  // Set offset
  if (queryOptions.offset && !count) {
    query = query.offset(queryOptions.offset);
  }


  // Wait for query to finish
  const res = await query;

  // Return count
  if (count) {
    if (res.length && res[0].count) {
      return res[0].count;
    }
    return 0;
  }

  // Return rows
  return res;
}


async function executeMainQuery(handler) {
  const res = {
    limit: handler.queryOptions.limit,
    offset: handler.queryOptions.offset,
    rows: [],
    count: 0,
  };

  const countQuery = executeMainQueryPart(
    handler.model, handler.queryOptions, true
  );


  if (handler.queryOptions.limit > 0 || !handler.config.paginate) {
    const rowQuery = executeMainQueryPart(handler.model, handler.queryOptions);

    const [rows, count] = await Promise.all([rowQuery, countQuery]);

    return {
      ...res,
      rows,
      count: +count,
    };
  }

  return {
    ...res,
    count: +(await countQuery),
  };
}


/**
 * Process the defined queries and return data
 * @param {object} handler
 */
async function executeQuery(handler) {
  const result = await executeMainQuery(handler);
  result.limit = handler.queryOptions.limit;
  result.offset = handler.queryOptions.offset;

  // Run any include queries
  if (result.rows.length > 0) {
    await executeRelationQueries(handler, result.rows);
  }

  return result;
}


function formatDocument(obj) {
  const res = {};

  Object.keys(obj).forEach((key) => {
    let ref = obj[key];

    if (isObject(ref) && Object.keys(ref).length) {
      ref = formatDocument(ref);
    }

    // Remove attributes with empty or null values
    if (
      (!isObject(ref) || Object.keys(ref).length)
      && (!Array.isArray(ref) || ref.length)
      && ref !== null
      && ref !== undefined
    ) {
      res[_.snakeCase(key)] = ref;
    }
  });

  return res;
}


function formatResults(handler, results) {
  let documents = [];
  let rows = results;
  let singleDocument = false;

  // Single document by ID
  if (handler.id) {
    if (!results.count) {
      return null;
    }
    rows = [results.rows[0]];
  }
  // Single document
  else if (results instanceof BaseModel) {
    rows = [results];
    singleDocument = true;
  }
  // Paginated result
  else if (!Array.isArray(results)) {
    ({ rows } = results);
  }

  rows.forEach((row) => {
    const document = row.$toJson();

    // Only return requested fields
    Object.keys(document).forEach((key) => {
      if (!handler.fields.includes(key)) {
        delete document[key];
      }
    });


    // Process includes
    Object.keys(handler.relations).forEach((relationKey) => {
      if (row[relationKey]) {
        document[relationKey] = formatResults(
          handler.relations[relationKey],
          row[relationKey]
        );
      }
    });

    documents.push(document);
  });

  // Remove null values
  documents = documents.map((doc) => formatDocument(doc));

  // Return single document
  if (handler.id || singleDocument) {
    return documents[0];
  }
  // Return array of documents
  if (Array.isArray(results)) {
    return documents;
  }

  // Return paginated result
  const formattedResult = {
    count: results.count,
    limit: results.limit,
    offset: results.offset,
    documents,
  };
  return formattedResult;
}


/**
 * Run recursively every query needed for the request
 * @param {object} handler The handler object from validateAndFormat()
 */
export default async function (handler) {
  const result = await executeQuery(handler);

  return formatResults(handler, result);
}

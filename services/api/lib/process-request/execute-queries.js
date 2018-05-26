import _ from 'lodash';

import { isObject, isString } from '@turistforeningen/ntb-shared-utils';
import { knex } from '@turistforeningen/ntb-shared-db-utils';
import { BaseModel } from '@turistforeningen/ntb-shared-models';

import runDBQuery from './run-db-query';


async function OLD_createLateralIncludeSqlQuery(handler, include) {
  const { association } = include;
  let sql = await getSqlFromFindAll(
    association.target,
    include.sequelizeOptions
  );

  // Replace existing limits and offsets
  sql = sql.replace(/LIMIT [0-9]+ OFFSET [0-9]+/g, '');

  // Inject WHERE clause to connect outer table with the lateral join
  const orderByPos = sql.lastIndexOf(' ORDER BY ');
  let wherePos = sql.lastIndexOf(' WHERE ');
  if (wherePos === -1) {
    wherePos = null;
  }

  const outerIdField = `"outer"."${association.sourceKeyField}"`;
  const joinOnOuterField = (
    `"${association.target.name}".` +
    `"${_.snakeCase(association.options.targetKey)}"`
  );

  sql = (
    `${sql.substr(0, wherePos || orderByPos)} WHERE ` +
    `${joinOnOuterField} = ${outerIdField} ` +
    `${wherePos ? 'AND' : ''} ${sql.substr(orderByPos)} ` +
    `LIMIT ${include.sequelizeOptions.limit} ` +
    `OFFSET ${include.sequelizeOptions.offset} `
  );

  // Add outer sql an lateral join the main sql
  sql = (
    `SELECT ${outerIdField} AS "outerid", "${association.as}".* ` +
    `FROM "public"."${association.source.tableName}" AS "outer", ` +
    `LATERAL (${sql}) AS "${association.as}" ` +
    `WHERE ${outerIdField} IN (?) ORDER BY ${outerIdField}`
  );

  return sql;
}


async function OLD_getLateralInclude(handler, include, identifiers) {
  if (
    include.sequelizeOptions.limit === undefined
    || include.sequelizeOptions.limit === null
    || include.sequelizeOptions.limit > 0
  ) {
    // Create the include sql
    const sqlQuery = await createLateralIncludeSqlQuery(
      handler, include
    );

    const query = db.sequelize.query(sqlQuery, {
      type: db.sequelize.QueryTypes.SELECT,
      replacements: [identifiers],
    });

    const result = await query;
    return result;
  }

  return [];
}


async function OLD_getIncludeCount(handler, include, identifiers) {
  const { association } = include;
  const countField = '*';

  const identifierKey = _.snakeCase(association.options.targetKey);
  const sequelizeOptions = { ...include.sequelizeOptions };
  sequelizeOptions.attributes = [
    identifierKey,
    [
      db.sequelize.fn(
        'COUNT',
        countField,
      ),
      'count',
    ],
  ];
  sequelizeOptions.group = [identifierKey];
  sequelizeOptions.distinct = true;
  sequelizeOptions.raw = true;
  sequelizeOptions.limit = null;
  sequelizeOptions.offset = null;
  sequelizeOptions.order = null;
  sequelizeOptions.where = {
    ...sequelizeOptions.where,
    [identifierKey]: {
      [Op.in]: identifiers,
    },
  };

  const rows = await association.target.findAll(sequelizeOptions);

  // Rename otherKey to a generic key name for later use
  const counts = rows.map((c) => {
    c.outerid = c[identifierKey];
    delete c[identifierKey];
    return c;
  });

  return counts;
}


function OLD_getIncludeThroughSequelizeOptions(include, identifiers) {
  const { association, sequelizeOptions } = include;

  return {
    attributes: include.throughAttributes,
    include: [
      {
        ...sequelizeOptions,
        association: association.toTarget,
        order: null,
        required: true,
      },
    ],
    where: {
      [association.identifier]: {
        [Op.in]: identifiers,
      },
    },
  };
}


async function OLD_createLateralIncludeThroughSqlQuery(handler, include) {
  const { association } = include;
  const outerIdField = `"outer"."${association.toSource.targetKeyField}"`;

  const attributes = include.sequelizeOptions.attributes.map((a) => {
    if (isString(a)) {
      return [_.snakeCase(a), `${association.target.name}__${a}`];
    }
    return a;
  });
  const throughAttributes = (include.throughAttributes || []).map((a) => {
    if (isString(a)) {
      return [_.snakeCase(a), a];
    }
    return a;
  });

  const sequelizeOptions = {
    ...include.sequelizeOptions,
    attributes,
    include: [{
      association: association.manyFromTarget,
      attributes: throughAttributes,
    }],
  };

  let sql = await getSqlFromFindAll(association.target, sequelizeOptions);

  // Replace existing limits and offsets
  sql = sql.replace(/LIMIT [0-9]+ OFFSET [0-9]+/g, '');

  // Replace "LEFT OUTER JOIN" WITH "INNER JOIN"
  sql = sql.replace(
    `LEFT OUTER JOIN "${association.through.model.tableName}"`,
    `INNER JOIN "${association.through.model.tableName}"`
  );

  // Inject WHERE clause to connect outer table with the lateral join
  const innerJoinByPos = sql.lastIndexOf(' INNER JOIN ');
  const orderByPos = sql.lastIndexOf(' ORDER BY ');
  let wherePos = sql.indexOf(' WHERE ', innerJoinByPos);
  if (wherePos === -1) {
    wherePos = null;
  }

  const joinOnOuterField = (
    `"${association.manyFromTarget.as}".` +
    `"${association.manyFromSource.identifierField}"`
  );

  sql = (
    `${sql.substr(0, wherePos || orderByPos)} WHERE ` +
    `${joinOnOuterField} = ${outerIdField} ` +
    `${wherePos ? 'AND' : ''} ${sql.substr(orderByPos)} ` +
    `LIMIT ${include.sequelizeOptions.limit} ` +
    `OFFSET ${include.sequelizeOptions.offset} `
  );

  // Add outer sql an lateral join the main sql
  sql = (
    `SELECT ${outerIdField} AS "outerid", "${association.as}".* ` +
    `FROM "public"."${association.source.tableName}" AS "outer", ` +
    `LATERAL (${sql}) AS "${association.as}" ` +
    `WHERE ${outerIdField} IN (?) ORDER BY ${outerIdField}`
  );

  return sql;
}


async function OLD_getLateralThroughInclude(handler, include, identifiers) {
  if (
    include.sequelizeOptions.limit === undefined
    || include.sequelizeOptions.limit === null
    || include.sequelizeOptions.limit > 0
  ) {
    // Create the include sql
    const sqlQuery = await createLateralIncludeThroughSqlQuery(
      handler, include
    );

    const query = db.sequelize.query(sqlQuery, {
      type: db.sequelize.QueryTypes.SELECT,
      replacements: [identifiers],
    });

    const result = await query;
    return result;
  }

  return [];
}


async function OLD_getThroughIncludeCount(handler, include, identifiers) {
  const { association } = include;
  const countField = '*';

  const sequelizeOptions = getIncludeThroughSequelizeOptions(
    include, identifiers
  );

  sequelizeOptions.attributes = [
    association.identifier,
    [
      db.sequelize.fn(
        'COUNT',
        countField,
      ),
      'count',
    ],
  ];
  sequelizeOptions.group = [association.identifier];
  sequelizeOptions.distinct = true;
  sequelizeOptions.raw = true;
  sequelizeOptions.include[0] = {
    ...sequelizeOptions.include[0],
    limit: null,
    offset: null,
    attributes: [],
  };

  const rows = await association.through.model.findAll(sequelizeOptions);

  // Rename otherKey to a generic key name for later use
  const counts = rows.map((c) => {
    c.outerid = c[association.identifier];
    delete c[association.identifier];
    return c;
  });

  return counts;
}


async function OLD_executeSingleAssociation(
  handler,
  include,
  key,
  outerInstances
) {
  const { association, sequelizeOptions } = include;
  const identifiers = Array.from(new Set(
    outerInstances
      .map((r) => r._targetDocument[association.identifier])
      .filter((r) => r !== null)
  ));

  if (!identifiers.length) {
    return [];
  }

  const rows = await association.target.findAll({
    ...sequelizeOptions,
    where: {
      ...(sequelizeOptions.where || {}),
      [association.targetIdentifier]: { [Op.in]: identifiers },
    },
  });

  const includeInstances = [];
  if (rows && rows.length) {
    rows.forEach((row) => {
      // Find the main rows
      const outers = outerInstances
        .filter((r) => (
          r._targetDocument[association.identifier] ===
            row[association.targetIdentifier]
        ));
      if (!outers || !outers.length) {
        throw new Error('Unable to map include.row with outer.row');
      }

      // Add target document reference
      row._targetDocument = row;
      includeInstances.push(row);

      outers.forEach((outer) => {
        // Set the instance association
        outer._targetDocument[key] = row;
      });
    });
  }

  return includeInstances;
}

async function OLD_executeMultiAssociation(
  handler,
  include,
  key,
  outerInstances
) {
  const { association, sequelizeOptions } = include;
  const identifiers = Array.from(new Set(
    outerInstances
      .map((r) => r._targetDocument[association.foreignKey])
      .filter((r) => r !== null)
  ));

  if (!identifiers.length) {
    return [];
  }

  const rows = await association.target.findAll({
    ...sequelizeOptions,
    where: {
      ...(sequelizeOptions.where || {}),
      [association.options.targetKey]: { [Op.in]: identifiers },
    },
  });

  const includeInstances = [];
  if (rows && rows.length) {
    rows.forEach((row) => {
      // Find the main rows
      const outers = outerInstances
        .filter((r) => (
          r._targetDocument[association.foreignKey] ===
            row[association.options.targetKey]
        ));
      if (!outers || !outers.length) {
        throw new Error('Unable to map include.row with outer.row');
      }

      // Add target document reference
      row._targetDocument = row;
      includeInstances.push(row);

      outers.forEach((outer) => {
        if (!outer._targetDocument[key]) {
          outer._targetDocument[key] = [];
        }
        // Set the instance association
        outer._targetDocument[key].push(row);
      });
    });
  }

  return includeInstances;
}


async function OLD_executePaginatedMultiAssociation(
  handler,
  include,
  key,
  outerInstances
) {
  const { association } = include;
  const sourceIdentifier = association.foreignKey;
  const identifiers = Array.from(new Set(
    outerInstances
      .map((r) => r._targetDocument[sourceIdentifier])
      .filter((r) => r !== null)
  ));

  if (!identifiers.length) {
    return [];
  }

  const queryCount = getIncludeCount(handler, include, identifiers);
  const rowQuery = getLateralInclude(handler, include, identifiers);

  const includeInstances = [];
  const [rows, counts] = await Promise.all([rowQuery, queryCount]);

  const baseOpts = {
    limit: include.sequelizeOptions.limit,
    offset: include.sequelizeOptions.offset,
  };

  // Map the results to the include model
  rows.forEach((row) => {
    // Find the main rows
    const outers = outerInstances
      .filter((r) => r._targetDocument[sourceIdentifier] === row.outerid);
    if (!outers || !outers.length) {
      throw new Error('Unable to map count.row with outer.row');
    }

    // Add target document reference
    const targetInstance = new association.target(row);
    targetInstance._targetDocument = row;
    includeInstances.push(targetInstance);

    outers.forEach((outer) => {
      // Initiate include array
      if (!outer._targetDocument[key]) {
        outer._targetDocument[key] = { ...baseOpts, rows: [], count: null };
      }

      // Append the instance
      outer._targetDocument[key].rows.push(targetInstance);
    });
  });

  // Map the counts to the include model
  counts.forEach((count) => {
    // Find the main rows
    const outers = outerInstances
      .filter((r) => r._targetDocument[sourceIdentifier] === count.outerid);
    if (!outers || !outers.length) {
      throw new Error('Unable to map count.row with outer.row');
    }

    outers.forEach((outer) => {
      // Initiate include array
      if (!outer._targetDocument[key]) {
        outer._targetDocument[key] = { ...baseOpts, rows: [], count: null };
      }

      // Append the instance
      outer._targetDocument[key].count = +count.count;
    });
  });

  return includeInstances;
}


async function OLD_executeMultiThroughAssociation(
  handler,
  include,
  key,
  outerInstances
) {
  const { association } = include;
  const identifiers = Array.from(new Set(
    outerInstances
      .map((r) => r._targetDocument[
        association.manyFromSource.sourceIdentifier
      ])
      .filter((r) => r !== null)
  ));

  if (!identifiers.length) {
    return [];
  }

  const sequelizeOptions = getIncludeThroughSequelizeOptions(
    include, identifiers
  );

  const rows = await association.through.model.findAll(sequelizeOptions);

  const includeInstances = [];
  if (rows && rows.length) {
    rows.forEach((row) => {
      // Find the main rows
      const outers = outerInstances
        .filter((r) => {
          const outerIdentifier = r._targetDocument[
            association.toSource.targetIdentifier
          ];
          const rowIdentifier = row[association.identifier];
          return outerIdentifier === rowIdentifier;
        });
      if (!outers || !outers.length) {
        throw new Error('Unable to map include.row with outer.row');
      }

      // Add sourceModelName identifier used for formatting
      row._sourceModelName = association.source.name;
      // Add target document reference
      row._targetDocument = row[association.target.name];

      // Append the instance
      includeInstances.push(row);
      outers.forEach((outer) => {
        // Initiate include array
        if (!outer._targetDocument[key]) {
          outer._targetDocument[key] = [];
        }
        outer._targetDocument[key].push(row);
      });
    });
  }

  return includeInstances;
}


async function OLD_executePaginatedMultiThroughAssociation(
  handler,
  include,
  key,
  outerInstances
) {
  const { association } = include;
  const { sourceIdentifier } = association.manyFromSource;
  const identifiers = Array.from(new Set(
    outerInstances
      .map((r) => r._targetDocument[
        association.manyFromSource.sourceIdentifier
      ])
      .filter((r) => r !== null)
  ));

  if (!identifiers.length) {
    return [];
  }

  const includeInstances = [];
  const queryCount = getThroughIncludeCount(handler, include, identifiers);
  const rowQuery = getLateralThroughInclude(handler, include, identifiers);

  const [rows, counts] = await Promise.all([rowQuery, queryCount]);
  const baseOpts = {
    limit: include.sequelizeOptions.limit,
    offset: include.sequelizeOptions.offset,
  };

  // Map the results to the include model
  rows.forEach((row) => {
    // Find the main rows
    const outers = outerInstances
      .filter((r) => r._targetDocument[sourceIdentifier] === row.outerid);
    if (!outers || !outers.length) {
      throw new Error('Unable to map include.row with outer.row');
    }

    const throughAttributes = {};
    const targetAttributes = {};
    const targetKeyPrefix = `${association.target.name}__`;
    const throughKeyPrefix = `${association.manyFromSource.as}.`;
    Object.keys(row).forEach((rowKey) => {
      if (rowKey.startsWith(targetKeyPrefix)) {
        const targetKey = rowKey.substr(targetKeyPrefix.length);
        targetAttributes[targetKey] = row[rowKey];
      }
      else {
        let k = rowKey;
        if (k.startsWith(throughKeyPrefix)) {
          k = k.substr(throughKeyPrefix.length);
        }
        throughAttributes[k] = row[rowKey];
      }
    });

    const targetInstance = new association.target(targetAttributes);
    const throughInstance = new association.through.model(throughAttributes);
    throughInstance._sourceModelName = association.source.name;
    throughInstance[association.target.name] = targetInstance;
    throughInstance._targetDocument = targetInstance;
    includeInstances.push(throughInstance);

    outers.forEach((outer) => {
      // Initiate include array
      if (!outer._targetDocument[key]) {
        outer._targetDocument[key] = { ...baseOpts, rows: [], count: null };
      }

      // Append the instance
      outer._targetDocument[key].rows.push(throughInstance);
    });
  });

  // Map the counts to the include model
  counts.forEach((count) => {
    // Find the main rows
    const outers = outerInstances
      .filter((r) => r._targetDocument[sourceIdentifier] === count.outerid);
    if (!outers || !outers.length) {
      throw new Error('Unable to map count.row with outer.row');
    }

    outers.forEach((outer) => {
      // Initiate include array
      if (!outer._targetDocument[key]) {
        outer._targetDocument[key] = { ...baseOpts, rows: [], count: null };
      }

      // Append the instance
      outer._targetDocument[key].count = +count.count;
    });
  });

  return includeInstances;
}


function createPaginatedMultiThroughSubQuery(handler, joinOnOuter = true) {
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
  let subQuery = createPaginatedMultiThroughSubQuery(handler, true);

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
    `CROSS JOIN LATERAL (?) ${relation.name}`,
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

  // Debug
  query.debug();

  return query;
}


function createPaginatedMultiThroughCountQuery(handler, identifiersByProp) {
  const { relation } = handler;

  // Create query
  let query = createPaginatedMultiThroughSubQuery(handler, false);

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

  // Debug
  query.debug();

  return query;
}


async function executePaginatedMultiThrough(
  handler,
  key,
  outerInstances
) {
  const { relation, queryOptions } = handler;
  const includeInstances = [];

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


async function executeIncludeQueries(handler, outerInstances) {
  if (!Object.keys(handler.relations).length) {
    return;
  }

  await Promise.all(
    Object.keys(handler.relations).map(async (key) => {
      const relationHandler = handler.relations[key];
      let relationInstances;
      const { relation } = relationHandler;

      if (relationHandler.config.paginate && relation.joinTable) {
        relationInstances = await executePaginatedMultiThrough(
          relationHandler, key, outerInstances,
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
        await executeIncludeQueries(relationHandler, relationInstances);
      }
    })
  );
}


async function executeMainQuery(handler) {
  const res = {
    limit: handler.queryOptions.limit,
    offset: handler.queryOptions.offset,
    rows: [],
    count: 0,
  };

  const countQuery = runDBQuery(handler.model, handler.queryOptions, true);


  if (handler.queryOptions.limit > 0 || !handler.config.paginate) {
    const rowQuery = runDBQuery(handler.model, handler.queryOptions);

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
    await executeIncludeQueries(handler, result.rows);
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

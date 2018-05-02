import _ from 'lodash';

import db from '@turistforeningen/ntb-shared-models';
import { isObject, isString } from '@turistforeningen/ntb-shared-utils';
import { getSqlFromFindAll } from '@turistforeningen/ntb-shared-db-utils';


function getIncludeThroughSequelizeOptions(include, identifiers) {
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
        in: identifiers,
      },
    },
  };
}


async function createLateralIncludeSqlQuery(handler, include) {
  // const originModel = handler.model;
  // const { model, through } = include;
  // const throughModel = through
  //   ? model.associations[through.association].target
  //   : null;
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


async function getLateralThroughInclude(handler, include, identifiers) {
  if (
    include.sequelizeOptions.limit === undefined
    || include.sequelizeOptions.limit > 0
  ) {
    // Create the include sql
    const sqlQuery = await createLateralIncludeSqlQuery(handler, include);

    const query = db.sequelize.query(sqlQuery, {
      type: db.sequelize.QueryTypes.SELECT,
      replacements: [identifiers],
    });

    const result = await query;
    return result;
  }

  return [];
}


async function getThroughIncludeCount(handler, include, identifiers) {
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


async function executeSingleAssociation(
  handler,
  include,
  key,
  outerInstances
) {
  const { association, sequelizeOptions } = include;
  const identifiers = outerInstances
    .map((r) => r[association.identifier])
    .filter((r) => r !== null);

  if (!identifiers.length) {
    return [];
  }

  const rows = await association.target.findAll({
    ...sequelizeOptions,
    where: {
      ...(sequelizeOptions.where || {}),
      [association.targetIdentifier]: { in: identifiers },
    },
  });

  const includeInstances = [];
  if (rows && rows.length) {
    rows.forEach((row) => {
      // Find the main rows
      const outers = outerInstances
        .filter((r) => (
          r[association.identifier] === row[association.targetIdentifier]
        ));
      if (!outers || !outers.length) {
        throw new Error('Unable to map include.row with outer.row');
      }

      outers.forEach((outer) => {
        // Set the instance association
        includeInstances.push(row);
        outer[key] = row;
      });
    });
  }

  return includeInstances;
}


async function executeMultiThroughAssociation(
  handler,
  include,
  key,
  outerInstances
) {
  const { association } = include;
  const identifiers = outerInstances
    .map((r) => r[association.manyFromSource.sourceIdentifier])
    .filter((r) => r !== null);

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
          const outerIdentifier = r[association.toSource.targetIdentifier];
          const rowIdentifier = row[association.identifier];
          return outerIdentifier === rowIdentifier;
        });
      if (!outers || !outers.length) {
        throw new Error('Unable to map include.row with outer.row');
      }

      // Add sourceModelName identifier used for formatting
      row._sourceModelName = association.source.name;

      // Append the instance
      includeInstances.push(row);
      outers.forEach((outer) => {
        // Initiate include array
        if (!outer[key]) {
          outer[key] = [];
        }
        outer[key].push(row);
      });
    });
  }

  return includeInstances;
}


async function executePaginatedMultiThroughAssociation(
  handler,
  include,
  key,
  outerInstances
) {
  const { association } = include;
  const { sourceIdentifier } = association.manyFromSource;
  const identifiers = outerInstances
    .map((r) => r[association.manyFromSource.sourceIdentifier])
    .filter((r) => r !== null);

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
      .filter((r) => r[sourceIdentifier] === row.outerid);
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
    includeInstances.push(throughInstance);

    outers.forEach((outer) => {
      // Initiate include array
      if (!outer[key]) {
        outer[key] = { ...baseOpts, rows: [], count: null };
      }

      // Append the instance
      outer[key].rows.push(throughInstance);
    });
  });

  // Map the counts to the include model
  counts.forEach((count) => {
    // Find the main rows
    const outers = outerInstances
      .filter((r) => r[sourceIdentifier] === count.outerid);
    if (!outers || !outers.length) {
      throw new Error('Unable to map count.row with outer.row');
    }

    outers.forEach((outer) => {
      // Initiate include array
      if (!outer[key]) {
        outer[key] = { ...baseOpts, rows: [], count: null };
      }

      // Append the instance
      outer[key].count = +count.count;
    });
  });

  return includeInstances;
}


async function executeIncludeQueries(handler, outerInstances) {
  if (!Object.keys(handler.include).length) {
    return;
  }

  await Promise.all(
    Object.keys(handler.include).map(async (key) => {
      const include = handler.include[key];
      let includeInstances;
      const { association } = include;
      const { isSingleAssociation } = association;

      if (include.config.paginate && association.through) {
        includeInstances = await executePaginatedMultiThroughAssociation(
          handler, include, key, outerInstances,
        );
      }
      else if (isSingleAssociation) {
        includeInstances = await executeSingleAssociation(
          handler, include, key, outerInstances
        );
      }
      else if (association.through) {
        includeInstances = await executeMultiThroughAssociation(
          handler, include, key, outerInstances
        );
      }
      else {
        throw new Error(
          'Not yet implemented this kind of include association'
        );
      }

      // else if (include.single || !include.config.paginate) {
      //   includeInstances = await executeUnpaginatedIncludeQueries(
      //     handler, key, include, outerInstances
      //   );
      // }
      // else {
      //   includeInstances = await executePaginatedIncludeQueries(
      //     handler, key, include, outerInstances
      //   );
      // }

      // Recursive include
      if (Object.keys(include.include).length && includeInstances.length) {
        await executeIncludeQueries(include, includeInstances);
      }
    })
  );
}


async function executeMainQuery(handler) {
  if (handler.sequelizeOptions.limit > 0 || !handler.config.paginate) {
    const res = await handler.model.findAndCountAll(handler.sequelizeOptions);
    return res;
  }

  return {
    rows: [],
    count: await handler.model.count({
      ...handler.sequelizeOptions,
      attributes: undefined,
      limit: undefined,
      offset: undefined,
    }),
  };
}


/**
 * Process the defined queries and return data
 * @param {object} handler
 */
async function executeQuery(handler) {
  const result = await executeMainQuery(handler);
  result.limit = handler.sequelizeOptions.limit;
  result.offset = handler.sequelizeOptions.offset;

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
  let formattedResult = [];
  let documents = [];
  let rows = results;

  // Single document
  if (results instanceof db.Sequelize.Model) {
    return formatDocument(results.format());
  }

  // Set configuration for paginated result
  if (!Array.isArray(results)) {
    formattedResult = {
      count: results.count,
      limit: results.limit,
      offset: results.offset,
      documents: [],
    };

    ({ documents } = formattedResult);
    ({ rows } = results);
  }

  rows.forEach((row) => {
    const document = row.format();

    // Only return requested fields
    Object.keys(document).forEach((key) => {
      const verifyFields = handler.fields.concat(handler.throughFields || []);
      if (!verifyFields.includes(key)) {
        delete document[key];
      }
    });

    // Process includes
    Object.keys(handler.include).forEach((includeKey) => {
      if (row[includeKey]) {
        document[includeKey] = formatResults(
          handler.include[includeKey],
          row[includeKey]
        );
      }
    });

    documents.push(document);
  });

  // Remove null values
  documents = documents.map((doc) => formatDocument(doc));

  if (Array.isArray(results)) {
    formattedResult = documents;
  }
  else {
    formattedResult.documents = documents;
  }

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

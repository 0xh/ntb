import _ from 'lodash';

import db from '@turistforeningen/ntb-shared-models';
import { isObject } from '@turistforeningen/ntb-shared-utils';
import { getSqlFromFindAll } from '@turistforeningen/ntb-shared-db-utils';


async function createLateralIncludeSqlQuery(handler, include) {
  const originModel = handler.model;
  const { model, through } = include;
  const throughModel = through
    ? model.associations[through.association].target
    : null;

  const sequelizeOptions = { ...include.sequelizeOptions };
  if (through) {
    sequelizeOptions.include = [{
      association: through.association,
      attributes: [],
    }];
  }
  let sql = await getSqlFromFindAll(model, sequelizeOptions);

  // Replace existing limits and offsets
  sql = sql.replace(/LIMIT [0-9]+ OFFSET [0-9]+/g, '');

  // Replace "LEFT OUTER JOIN" WITH "INNER JOIN"
  if (through) {
    sql = sql.replace(
      `LEFT OUTER JOIN "${throughModel.tableName}"`,
      `INNER JOIN "${throughModel.tableName}"`
    );
  }

  // Inject WHERE clause to connect outer table with the lateral join
  const innerJoinByPos = sql.lastIndexOf(' INNER JOIN ');
  const orderByPos = sql.lastIndexOf(' ORDER BY ');
  let wherePos = sql.indexOf(' WHERE ', innerJoinByPos);
  if (wherePos === -1) {
    wherePos = null;
  }

  const joinOnOuterField = through
    ? `"${through.association}"."${_.snakeCase(through.otherKey)}"`
    : `"${model.name}"."${_.snakeCase(include.foreignKey)}"`;

  sql = (
    `${sql.substr(0, wherePos || orderByPos)} WHERE ` +
    `${joinOnOuterField} = "outer"."uuid" ` +
    `${wherePos ? 'AND' : ''} ${sql.substr(orderByPos)} ` +
    `LIMIT ${include.sequelizeOptions.limit} ` +
    `OFFSET ${include.sequelizeOptions.offset} `
  );

  // Add outer sql an lateral join the main sql
  sql = (
    `SELECT "outer"."uuid" AS "outerid", "${model.name}".* ` +
    `FROM "public"."${originModel.tableName}" AS "outer", ` +
    `LATERAL (${sql}) AS "${model.name}" ` +
    'WHERE "outer"."uuid" IN (?) ORDER BY "outer"."uuid"'
  );

  return sql;
}


async function getIncludeCount(handler, include, refs) {
  const { model, through } = include;
  let groupByField = include.foreignKey;
  let countField = '*';
  let sequelizeOptionsinclude = null;
  let queryModel = model;

  const inheritSequelizeOptions = {
    ...include.sequelizeOptions,
    order: null,
    limit: null,
    offset: null,
  };

  if (through) {
    queryModel = model.associations[through.association].target;
    groupByField = through.otherKey;
    sequelizeOptionsinclude = [{
      association: through.reverseAssociation,
      ...inheritSequelizeOptions,
      attributes: [],
      required: true,
    }];
    countField = `"${queryModel.name}"."${_.snakeCase(through.foreignKey)}"`;
  }

  const sequelizeOptions = {
    ...(through ? {} : inheritSequelizeOptions),
    include: sequelizeOptionsinclude,
    attributes: [
      groupByField,
      [
        model.sequelize.fn(
          'COUNT',
          countField,
        ),
        'count',
      ],
    ],
    group: [groupByField],
    distinct: true,
    where: {
      [groupByField]: {
        in: refs.map((r) => r.uuid),
      },
    },
    raw: true,
  };

  const res = await queryModel.findAll(sequelizeOptions);

  // Rename otherKey to a generic key name for later use
  const counts = res.map((c) => {
    c.outerid = c[groupByField];
    delete c[groupByField];
    return c;
  });

  return counts;
}


async function executePaginatedIncludeQueries(handler, outerInstances) {
  if (!Object.keys(handler.include).length) {
    return;
  }

  await Promise.all(
    Object.keys(handler.include).map(async (key) => {
      let rows;
      let counts;
      const include = handler.include[key];

      const queryCount = getIncludeCount(handler, include, outerInstances);

      if (
        include.sequelizeOptions.limit === undefined
        || include.sequelizeOptions.limit > 0
      ) {
        // Create the include sql
        const sqlQuery = await createLateralIncludeSqlQuery(handler, include);

        const query = db.sequelize.query(sqlQuery, {
          type: db.sequelize.QueryTypes.SELECT,
          replacements: [
            outerInstances.map((r) => r.uuid),
          ],
        });

        ([rows, counts] = await Promise.all([
          query,
          queryCount,
        ]));
      }
      else {
        rows = [];
        counts = await queryCount;
      }

      const baseOpts = {
        limit: include.sequelizeOptions.limit,
        offset: include.sequelizeOptions.offset,
      };

      // Map the results to the include model
      const includeInstances = [];
      rows.forEach((row) => {
        // Find the main rows
        const outers = outerInstances.filter((r) => r.uuid === row.outerid);
        if (!outers || !outers.length) {
          throw new Error('Unable to map include.row with outer.row');
        }

        outers.forEach((outer) => {
          // Initiate include array
          if (!outer[key]) {
            outer[key] = { ...baseOpts, rows: [], count: null };
          }

          // Append the instance
          const instance = new include.model(row);
          includeInstances.push(instance);
          outer[key].rows.push(instance);
        });
      });

      // Map the counts to the include model
      counts.forEach((count) => {
        // Find the main rows
        const outers = outerInstances.filter((r) => r.uuid === count.outerid);
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

      // Recursive include
      if (Object.keys(include.include).length && rows.length) {
        await executePaginatedIncludeQueries(include, includeInstances);
      }

      return Promise.resolve();
    })
  );
}


async function executeMainQuery(handler) {
  if (handler.sequelizeOptions.limit > 0) {
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
    await executePaginatedIncludeQueries(handler, result.rows);
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
  const formattedResult = {
    count: results.count,
    limit: results.limit,
    offset: results.offset,
    documents: [],
  };

  results.rows.forEach((row) => {
    const document = row.format();

    // Only return requested fields
    Object.keys(document).forEach((key) => {
      if (!handler.fields.includes(key)) {
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

    formattedResult.documents.push(document);
  });

  // Remove null values
  formattedResult.documents = formattedResult.documents
    .map((doc) => formatDocument(doc));

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

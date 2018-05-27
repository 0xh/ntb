/**
 * Parse the queryOptions and convert to a db-query. Will return the results.
 * @param {object} model The ObjectionJS-model
 * @param {object} queryOptions Options to parse and create a query from
 */
export default async function (model, queryOptions, count = false) {
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

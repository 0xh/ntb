export default function (handler, filter) {
  const { queryOptions } = handler;
  const { rawValue } = filter.query;

  if (!['', '!'].includes(rawValue)) {
    handler.errors.push(
      `Invalid value of '${filter.query.trace}'. ` +
      'Only a blank value or the value "!" is supported',
    );
  }

  const filteredRelations = (queryOptions.relations || [])
    .filter((r) => r.relationKey === filter.relationKey);

  if (!filteredRelations || filteredRelations.length !== 1) {
    throw new Error('Unable to find correct relation');
  }

  const relationJoin = filteredRelations[0];

  // Relation does not exist
  if (rawValue === '!') {
    relationJoin.joinType = 'leftJoin';
    return [
      {
        whereType: 'whereNull',
        options: [
          filter.attribute,
        ],
      },
    ];
  }

  // Relation exists
  relationJoin.joinType = 'innerJoin';
  return [];
}

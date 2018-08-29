import { createLogger } from '@turistforeningen/ntb-shared-utils';
import { knex } from '@turistforeningen/ntb-shared-db-utils';


const logger = createLogger();


async function resetTripPathBufferss(routeType) {
  logger.info('Emptying path buffers where path has been reset');

  const status = await knex.raw(`
    UPDATE trips SET
      path_buffer = NULL
    WHERE
      path IS NULL
      AND path_buffer IS NOT NULL
  `);

  logger.info(`- Updated ${status.rowCount} rows`);
}


async function createTripPathBufferBulk(limit, offset) {
  logger.info(`Create path buffer with offset ${offset}`);

  const result = await knex.raw(`
    UPDATE trips SET
      path_buffer = ST_Buffer(x.path::GEOGRAPHY, 5000, 1)::GEOMETRY
    FROM (
      SELECT
        t.id,
        t.path
      FROM trips t
      WHERE
          t.path IS NOT NULL
      ORDER BY
        t.id
      LIMIT :limit
      OFFSET :offset
    ) x
    WHERE
      trips.id = x.id
  `, {
    limit,
    offset,
  });

  logger.info(`- Updated ${result.rowCount} rows`);
  return result.rowCount;
}


async function createTripPathBuffer(routeType, geometryTableName) {
  await resetTripPathBufferss(routeType);

  const limit = 1;
  let rowCount = 1;
  let offset = 0;
  let iterationIndex = 0;
  const maxIterations = 20;
  while (rowCount === limit && iterationIndex < maxIterations) {
    // eslint-disable-next-line
    rowCount = await createTripPathBufferBulk(limit, offset);
    offset += limit;
    iterationIndex += 1;
  }
}


async function main() {
  await createTripPathBuffer();
}


main()
  .then((res) => {
    logger.info('ALL DONE');
    process.exit(0);
  })
  .catch((err) => {
    logger.error('UNCAUGHT ERROR');
    logger.error(err);
    logger.error(err.stack);
    process.exit(1);
  });

import { createLogger } from '@turistforeningen/ntb-shared-utils';
import { knex } from '@turistforeningen/ntb-shared-db-utils';


const logger = createLogger();


async function resetTripPathBufferss() {
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


async function createTripPathBufferBulk(limit) {
  logger.info('Create path buffer');

  const result = await knex.raw(`
    UPDATE trips SET
      path_buffer = ST_Buffer(x.path, 5000, 1)
    FROM (
      SELECT
        t.id,
        t.path
      FROM trips t
      WHERE
          t.path IS NOT NULL
          AND t.path_buffer IS NULL
      ORDER BY
        t.id
      LIMIT :limit
    ) x
    WHERE
      trips.id = x.id
  `, {
    limit,
  });

  logger.info(`- Updated ${result.rowCount} rows`);
  return result.rowCount;
}


async function getRemainingCount(routeType) {
  logger.info('Fetchin remaing trips to be updated');

  const result = await knex('trips')
    .whereNull('pathBuffer')
    .whereNotNull('path')
    .count();

  if (result && result.length) {
    logger.info(`- REMAINING ${result[0].count} trips`);
  }
  else {
    logger.info('- NO REMAINING trips');
  }
}


async function createTripPathBuffer() {
  await resetTripPathBufferss();

  const limit = 1;
  let rowCount = 1;
  let iterationIndex = 0;
  while (rowCount === limit) {
    // eslint-disable-next-line
    rowCount = await createTripPathBufferBulk(limit);
    iterationIndex += 1;

    if (iterationIndex % 10 === 0) {
      // eslint-disable-next-line
      await getRemainingCount(limit);
      iterationIndex = 0;
    }
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

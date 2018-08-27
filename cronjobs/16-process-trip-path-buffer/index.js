import moment from 'moment';

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
  `);

  logger.info(`- Updated ${status.rowCount} rows`);
}


async function createTripPathBufferBulk(offset) {
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
      LIMIT 100
      OFFSET :offset
    ) x
    WHERE
      trips.id = x.id
  `, {
    offset,
  });

  logger.info(`- Updated ${result.rowCount} rows`);
  return result.rowCount;
}


async function createTripPathBuffer(routeType, geometryTableName) {
  await resetTripPathBufferss(routeType);

  let rowCount = 1;
  let offset = 0;
  while (rowCount > 0) {
    // eslint-disable-next-line
    rowCount = await createTripPathBufferBulk(
      routeType,
      geometryTableName,
      offset
    );
    offset += 100;
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

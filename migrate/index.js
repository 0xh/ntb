import path from 'path';

import { knex } from '@turistforeningen/ntb-shared-db-utils';
import { createLogger } from '@turistforeningen/ntb-shared-utils';


const logger = createLogger();

const migrateConfig = {
  directory: path.resolve(__dirname, 'migrations'),
  tableName: 'knex_migrations',
  schemaName: 'public',
  disableTransactions: false,
  extension: 'js',
  loadExtenstions: ['.js'],
};


async function make() {
  const name = process.argv[3].trim();

  if (!name) {
    throw new Error('Invalid migration name');
  }

  const migrationName = await knex.migrate.make(name, migrateConfig);
  logger.info(`Created migration: ${migrationName}`);
}


async function latest() {
  await knex.migrate.latest(migrateConfig).spread((batchNo, log) => {
    if (log.length === 0) {
      logger.info('No migrations to run - you\'re up to date!');
    }
    else {
      logger.info(`Batch ${batchNo} run: ${log.length} migrations \n`);
      log.forEach((l) => logger.info(l));
    }
  });
}


async function rollback() {
  await knex.migrate.rollback(migrateConfig).spread((batchNo, log) => {
    if (log.length === 0) {
      logger.info('No migrations to run - you\'re up to date!');
    }
    else {
      logger.info(`Batch ${batchNo} rolled back: ${log.length} migrations \n`);
      log.forEach((l) => logger.info(l));
    }
  });
}


export default function migrate(cmd) {
  let executedCmd;


  logger.info(`${cmd.toUpperCase()} BEGIN`);

  switch (cmd) {
    case 'make':
      executedCmd = make();
      break;
    case 'latest':
      executedCmd = latest();
      break;
    case 'rollback':
      executedCmd = rollback();
      break;

    default:
      logger.error(`invalid cmd: ${cmd}`);
      process.exit(1);
  }

  if (executedCmd) {
    executedCmd
      .then((result) => {
        const doneStr = `${cmd.toUpperCase()} DONE`;
        logger.info(doneStr);
        logger.info('='.repeat(doneStr.length));
      })
      .catch((err) => {
        const errorStr = `${cmd.toUpperCase()} ERROR`;
        logger.error(errorStr);
        logger.error('='.repeat(errorStr.length));
        logger.error(err);
        logger.error(err.stack);
        logger.error('='.repeat(errorStr.length));
      })
      .then(() => {
        process.exit(0);
      });
  }
}

if (!module.parent) {
  const cmd = process.argv[2].trim();
  migrate(cmd);
}

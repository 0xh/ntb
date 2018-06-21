import path from 'path';

import knexMigrate from 'knex-migrate';

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


const config = {
  migrations: path.resolve(__dirname, 'migrations'),
};


async function make() {
  const name = process.argv.length > 3
    ? process.argv[3].trim()
    : null;

  if (!name) {
    logger.error('Invalid migration name');
    logger.error('Use command: make [name]');
    process.exit(1);
  }

  const migrationName = await knex.migrate.make(name, migrateConfig);
  logger.info(`Created migration: ${migrationName}`);
}


function log({ action, migration }) {
  logger.info(`Doing ${action} on ${migration}`);
}


export default function migrate(cmd, migrationId) {
  let executedCmd;


  logger.info(`${cmd.toUpperCase()} BEGIN`);

  switch (cmd) {
    case 'make':
      executedCmd = make();
      break;
    case 'up':
      if (migrationId) {
        executedCmd = knexMigrate('up', { ...config, to: migrationId }, log);
      }
      else {
        executedCmd = knexMigrate('up', { ...config }, log);
      }
      break;
    case 'down':
      if (migrationId) {
        executedCmd = knexMigrate('down', { ...config, to: migrationId }, log);
      }
      else {
        executedCmd = knexMigrate('down', { ...config, to: 0 }, log);
      }
      break;
    case 'next':
      executedCmd = knexMigrate('up', { ...config, step: 1 }, log);
      break;
    case 'previous':
      executedCmd = knexMigrate('down', { ...config, step: 1 }, log);
      break;
    case 'rollback':
      executedCmd = knexMigrate('rollback', { ...config, to: 0 }, log);
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
  const migrationId = process.argv.length > 3
    ? process.argv[3].trim()
    : null;
  migrate(cmd, migrationId);
}

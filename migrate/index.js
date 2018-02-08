import path from 'path';

import Umzug from 'umzug';

import db from '@turistforeningen/ntb-shared-models';
import { createLogger } from '@turistforeningen/ntb-shared-utils';


const logger = createLogger();

const umzug = new Umzug({
  storage: 'sequelize',
  storageOptions: {
    model: db.SequelizeMeta,
  },

  migrations: {
    params: [db],
    path: path.resolve(__dirname, 'migrations'),
    pattern: /\.js$/,
  },

  logging: function log(...args) {
    logger.info(args);
  },
});


function logUmzugEvent(eventName) {
  return (name, migration) => {
    logger.info(`${name} ${eventName}`);
  };
}


umzug.on('migrating', logUmzugEvent('migrating'));
umzug.on('migrated', logUmzugEvent('migrated'));
umzug.on('reverting', logUmzugEvent('reverting'));
umzug.on('reverted', logUmzugEvent('reverted'));


function cmdStatus() {
  const result = {};

  return umzug.executed()
    .then((executed) => {
      result.executed = executed;
      return umzug.pending();
    })
    .then((pending) => {
      result.pending = pending;
      return result;
    })
    .then(({ executed: ex, pending: pe }) => {
      const executed = ex.map((m) => {
        m.name = path.basename(m.file, '.js');
        return m;
      });
      const pending = pe.map((m) => {
        m.name = path.basename(m.file, '.js');
        return m;
      });

      const current = executed.length > 0
        ? executed[0].file
        : '<NO_MIGRATIONS>';
      const status = {
        current,
        executed: executed.map((m) => m.file),
        pending: pending.map((m) => m.file),
      };

      logger.info(JSON.stringify(status, null, 2));

      return { executed, pending };
    });
}


function cmdMigrate() {
  return umzug.up();
}


function cmdMigrateNext() {
  return cmdStatus()
    .then(({ executed, pending }) => {
      if (pending.length === 0) {
        return Promise.reject(new Error('No pending migrations'));
      }
      const next = pending[0].name;
      return umzug.up({ to: next });
    });
}


function cmdReset() {
  return umzug.down({ to: 0 });
}


function cmdResetPrev() {
  return cmdStatus()
    .then(({ executed, pending }) => {
      if (executed.length === 0) {
        return Promise.reject(new Error('Already at initial state'));
      }
      const prev = executed[executed.length - 1].name;
      return umzug.down({ to: prev });
    });
}


const cmd = process.argv[2].trim();
let executedCmd;


logger.info(`${cmd.toUpperCase()} BEGIN`);

switch (cmd) {
  case 'status':
    executedCmd = cmdStatus();
    break;

  case 'up':
  case 'migrate':
    executedCmd = cmdMigrate();
    break;

  case 'next':
  case 'migrate-next':
    executedCmd = cmdMigrateNext();
    break;

  case 'down':
  case 'reset':
    executedCmd = cmdReset();
    break;

  case 'prev':
  case 'reset-prev':
    executedCmd = cmdResetPrev();
    break;

  default:
    logger.info(`invalid cmd: ${cmd}`);
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
      if (cmd !== 'status' && cmd !== 'reset-hard') {
        return cmdStatus();
      }
      return Promise.resolve();
    })
    .then(() => {
      process.exit(0);
    });
}

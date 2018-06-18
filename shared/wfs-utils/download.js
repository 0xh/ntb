import { spawnSync } from 'child_process';

import moment from 'moment';

import settings from '@turistforeningen/ntb-shared-settings';
import { createLogger } from '@turistforeningen/ntb-shared-utils';


const logger = createLogger();


const PG_STRING = (
  `PG:dbname=${settings.DB_NAME} host=${settings.DB_HOST} ` +
  `port=${settings.DB_PORT} user=${settings.DB_USER} ` +
  `password=${settings.DB_PASSWORD}`
);


export default async function (wfs) {
  logger.info(`Starting wfs-download for ${wfs}`);

  const timeStamp = moment().format('YYYYMMDDHHmmssSSS');
  const tableName = `0_${timeStamp}_wfs`;

  const status = spawnSync('ogr2ogr', [
    '-lco',
    'OVERWRITE=YES',
    '-f',
    'PostgreSQL',
    `"${PG_STRING}"`,
    '-nln',
    tableName,
    `"WFS:${wfs}"`,
  ], {
    cwd: process.cwd(),
    env: process.env,
    shell: 'bash',
    stdio: 'pipe',
    encoding: 'utf-8',
  });

  let error = false;
  if (status.status !== 0 || status.stderr) {
    logger.warn(`ogr2ogr failed - status ${status.status}!`);
    error = true;
  }

  logger.info('ogr2ogr output start:');
  status.output.filter((o) => o).forEach((o) => {
    logger.info(o);
  });
  logger.info('ogr2ogr output end');

  return error
    ? false
    : tableName;
}

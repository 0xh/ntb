import { spawnSync } from 'child_process';

import moment from 'moment';

import settings from '@ntb/settings';
import { Logger } from '@ntb/utils';


const logger = Logger.getLogger();


const PG_STRING = (
  `PG:dbname=${settings.DB_NAME} host=${settings.DB_HOST} ` +
  `port=${settings.DB_PORT} user=${settings.DB_USER} ` +
  `password=${settings.DB_PASSWORD}`
);


export default async function (
  wfsUrl: string,
  targetTableName: string | null = null,
  forceCreate = false,
) {
  const r = /^(ftp|http|https):\/\/[^ "]+$/;
  if (!r.test(wfsUrl)) {
    throw new Error('Invalid wfs-url');
  }

  logger.info(`Starting wfs-download for ${wfsUrl}`);

  let tableName = targetTableName;
  let lco = !tableName || forceCreate
    ? ['-lco', 'GEOMETRY_NAME=wkb_geometry']
    : [];

  if (!tableName) {
    const timeStamp = moment().format('YYYYMMDDHHmmssSSS');
    tableName = `0_${timeStamp}_wfs`;
    lco = ['-lco', 'GEOMETRY_NAME=wkb_geometry'];
  }

  const status = spawnSync(
    'ogr2ogr',
    [
      '-f',
      'PostgreSQL',
      `"${PG_STRING}"`,
      '-nln',
      tableName,
      ...lco,
      `"WFS:${wfsUrl}"`,
    ],
    {
      cwd: process.cwd(),
      env: process.env,
      shell: 'bash',
      stdio: 'pipe',
      encoding: 'utf-8',
    },
  );

  let error = false;
  if (status.status !== 0 || status.stderr) {
    logger.warn(`ogr2ogr failed - status ${status.status}!`);
    error = true;
  }

  logger.info('ogr2ogr output start:');
  status.output
    .filter((o) => o)
    .forEach((o) => {
      logger.info(o);
    });
  logger.info('ogr2ogr output end');

  return error
    ? false
    : tableName;
}

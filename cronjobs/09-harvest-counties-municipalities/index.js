import fs from 'fs';
import path from 'path';

import moment from 'moment';

import { createLogger } from '@turistforeningen/ntb-shared-utils';
import { knex } from '@turistforeningen/ntb-shared-db-utils';
import wfsUtils from '@turistforeningen/ntb-shared-wfs-utils';


const logger = createLogger();

const SRS_NAME = 'urn:ogc:def:crs:EPSG::25833';
const FOLDER = path.resolve(__dirname, 'data');

const WFS = (
  'https://wfs.geonorge.no/skwms1/wfs.elf-au?service=WFS&version=2.0.0' +
  `&request=GetFeature&typeName=au:AdministrativeUnit&srsName=${SRS_NAME}`
);


async function downloadData() {
  const wfsTableName = await wfsUtils(WFS);

  if (wfsTableName === false) {
    logger.warn('Downloading wfs failed.');
    return false;
  }

  return true;
}


downloadData()
  .then((status) => {
    console.log('ALL DONE', status);  // eslint-disable-line
    console.log('****');  // eslint-disable-line
  });

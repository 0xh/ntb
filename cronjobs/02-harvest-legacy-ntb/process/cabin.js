// import moment from 'moment';

// import db from '@turistforeningen/ntb-shared-models';
import { createLogger, startDuration, endDuration } from
  '@turistforeningen/ntb-shared-utils';

import * as legacy from '../legacy-structure/';


const logger = createLogger();
// const DATASOURCE_NAME = 'legacy-ntb';


/**
 * Send legacy ntb data through a mapper that converts old structure to new
 */
async function mapData(handler) {
  logger.info('Mapping legacy data to new structure');
  const durationId = startDuration();
  const cabins = [];

  await Promise.all(
    handler.documents.steder
      .filter((d) => d.tags && d.tags[0] === 'Hytte')
      .map(async (d) => {
        const m = await legacy.hytter.mapping(d, handler);
        cabins.push(m);
      })
  );
  endDuration(durationId);

  handler.cabins.processed = cabins;
}


/**
 * Process legacy cabin data and merge it into the postgres database
 */
const process = async (handler) => {
  logger.info('Processing cabins');
  handler.cabins = {};

  await mapData(handler);
};


export default process;

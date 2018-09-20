import processRouteSegments
  from '@ntb/process-route-segments';
import { Logger } from '@ntb/utils';


const logger = Logger.getLogger();


const type = 'other';
const wfsTable = 'routes_wfs_data_other';
const unnestCodes = 'ARRAY[a.rutenummer]';
const unnestMaintainers = 'ARRAY[a.vedlikeholdsansvarlig]';


processRouteSegments(type, wfsTable, unnestCodes, unnestMaintainers)
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

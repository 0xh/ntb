import processRouteSegments
  from '@ntb/shared-process-route-segments';
import { createLogger } from '@ntb/shared-utils';


const logger = createLogger();


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

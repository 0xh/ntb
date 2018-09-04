import processRouteSegments
  from '@ntb/shared-process-route-segments';
import { createLogger } from '@ntb/shared-utils';


const logger = createLogger();


const type = 'ski';
const wfsTable = 'routes_wfs_data_ski';
const unnestCodes = (
  'string_to_array(substring(a.rutenummer ' +
  'from \'\\([0-9]+:(.+)\\)\'), \',\')'
); // (2:xx,xx)
const unnestMaintainers = (
  'string_to_array(substring(a.vedlikeholdsansvarlig ' +
  'from \'\\([0-9]+:(.+)\\)\'), \',\')'
);


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

import { createLogger, isNumber } from '@turistforeningen/ntb-shared-utils';
import { harvestRoute } from
  '@turistforeningen/ntb-shared-legacy-ntb-harvester';


const logger = createLogger();


let limit = 2000;
if (process.argv.length > 2 && isNumber(process.argv[2])) {
  limit = +process.argv[2];
}

harvestRoute(limit)
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('UNCAUGHT ERROR');
    logger.error(err);
    logger.error(err.stack);
    process.exit(1);
  });

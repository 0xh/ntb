import { createLogger, isNumber } from '@turistforeningen/ntb-shared-utils';
import { harvestCabin } from
  '@turistforeningen/ntb-shared-legacy-ntb-harvester';


const logger = createLogger();


let limit = 2000;
if (process.argv.length > 2 && isNumber(process.argv[2])) {
  limit = +process.argv[2];
}

harvestCabin(limit)
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('UNCAUGHT ERROR');
    logger.error(err);
    logger.error(err.stack);
    process.exit(1);
  });

import { Logger, isNumber } from '@ntb/utils';
import { harvestRoute } from
  '@ntb/legacy-ntb-harvester';


const logger = Logger.getLogger();


let fullHarvest = false;
if (process.argv.length > 2) {
  fullHarvest = process.argv[2] === 'true';
}

let limit = 2000;
if (process.argv.length > 3 && isNumber(process.argv[3])) {
  limit = +process.argv[3];
}

harvestRoute(limit, fullHarvest)
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('UNCAUGHT ERROR');
    logger.error(err);
    logger.error(err.stack);
    process.exit(1);
  });

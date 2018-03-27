import { createLogger } from '@turistforeningen/ntb-shared-utils';
import { harvestPictures } from
  '@turistforeningen/ntb-shared-legacy-ntb-harvester';


const logger = createLogger();


harvestPictures()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('UNCAUGHT ERROR');
    logger.error(err);
    logger.error(err.stack);
    process.exit(1);
  });

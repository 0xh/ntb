import { createLogger } from '@turistforeningen/ntb-shared-utils';
import { harvestLists } from
  '@turistforeningen/ntb-shared-legacy-ntb-harvester';


const logger = createLogger();

harvestLists()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('UNCAUGHT ERROR');
    logger.error(err);
    logger.error(err.stack);
    process.exit(1);
  });

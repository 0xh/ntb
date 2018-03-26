import { createLogger } from '@turistforeningen/ntb-shared-utils';
import { harvestAreas } from
  '@turistforeningen/ntb-shared-legacy-ntb-harvester';


const logger = createLogger();


let useTestData = false;
if (process.argv.length > 2 && process.argv[2].trim() === 'testdata') {
  useTestData = true;
}

harvestAreas(useTestData)
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('UNCAUGHT ERROR');
    logger.error(err);
    logger.error(err.stack);
    process.exit(1);
  });

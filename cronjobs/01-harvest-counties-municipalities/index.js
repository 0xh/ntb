import { createLogger } from '@turistforeningen/ntb-shared-utils';
import harvest from
  '@turistforeningen/ntb-shared-counties-municipalities-harvester';


const logger = createLogger();


harvest()
  .then((status) => {
    if (status) {
      logger.info('Done with success!');
      process.exit(0);
    }
    else {
      logger.error('Done with error!');
      process.exit(1);
    }
  })
  .catch((err) => {
    logger.error('UNCAUGHT ERROR');
    logger.error(err.stack);
    process.exit(1);
  });

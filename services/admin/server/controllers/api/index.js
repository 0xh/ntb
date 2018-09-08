import { express, responseTime } from '@ntb/web-server-utils';


import version from '../../version';

import versionController from './version';
import userController from './user';
import schemaController from './schema';


const { Router } = express;
const router = new Router();

// Log request count and response time to librato
router.use(responseTime((req, res, time) => {
  // General counts and meassurements
  // librato.increment(null, 'count');
  // librato.measure(null, 'response-time', time);

  // Path specific measurements
  // librato.increment(req, 'count');
  // librato.measure(req, 'response-time', time);
}));


// Add version header
router.use((req, res, next) => {
  res.header('APP-VERSION', version.tag);
  next();
});


// Add routes
router.use('/version', versionController);
router.use('/user', userController);
router.use('/schema', schemaController);


export default router;

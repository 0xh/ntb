import { express } from '@ntb/web-server-utils';

import modelsRouter from './models';


const { Router } = express;
const router = Router();


// Add model routers
router.use('/', modelsRouter);


export default router;

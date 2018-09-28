import { express } from '@ntb/web-server-utils';

import fullRouter from './full';


const { Router } = express;
const router = Router();


router.use('/full', fullRouter);


export default router;

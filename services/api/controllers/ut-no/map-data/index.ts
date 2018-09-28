import { express } from '@ntb/web-server-utils';

import compactRouter from './compact';
import fullRouter from './full';


const { Router } = express;
const router = Router();


router.use('/full', fullRouter);
router.use('/compact', compactRouter);


export default router;

import { express } from '@ntb/web-server-utils';

import mainFullTextSearchController from './main-full-text-search';

const { Router } = express;
const router = Router();


router.use('/main-full-text-search', mainFullTextSearchController);


export default router;

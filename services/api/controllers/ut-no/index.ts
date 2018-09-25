import { express } from '@ntb/web-server-utils';

import mainFullTextSearchController from './main-full-text-search';
import mapDataFullController from './map-data-full';

const { Router } = express;
const router = Router();


router.use('/main-full-text-search', mainFullTextSearchController);
router.use('/map-data/full', mapDataFullController);


export default router;

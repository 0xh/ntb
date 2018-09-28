import { express } from '@ntb/web-server-utils';

import autocompleteRouter from './autocomplete';
import mainFullTextSearchRouter from './main-full-text-search';
import mapDataRouter from './map-data';

const { Router } = express;
const router = Router();


router.use('/search/autocomplete', autocompleteRouter);
router.use('/search/generic-full-text', mainFullTextSearchRouter);
router.use('/map-data', mapDataRouter);


export default router;

import { express } from '@ntb/web-server-utils';

import autocompleteController from './autocomplete';
import mainFullTextSearchController from './main-full-text-search';
import mapDataFullController from './map-data-full';

const { Router } = express;
const router = Router();


router.use('/search/autocomplete', autocompleteController);
router.use('/search/generic-full-text', mainFullTextSearchController);
router.use('/map-data/full', mapDataFullController);


export default router;

import { express, morgan } from '@ntb/web-server-utils';

import modelsRouter from './models';
import utnoRouter from './ut-no';


const { Router } = express;
const router = Router();


// Access logs
router.use(morgan('combined'));


// robots.txt
router.get('/robots.txt', (_req, res, _next) => {
  res.type('text/plain').send('User-agent: *\r\nDisallow: /');
});

// Special routes for ut.no
router.use('/ut-no', utnoRouter);

// Add model routers
router.use('/', modelsRouter);


export default router;

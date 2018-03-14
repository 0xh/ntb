import { Router } from 'express';
import morgan from 'morgan';

import { createLogger } from '@turistforeningen/ntb-shared-utils';

import areaController from './area';


const logger = createLogger();
const router = new Router();

// Access logs
router.use(morgan('combined'));


// robots.txt
router.get('/robots.txt', (req, res, next) => {
  res.type('text/plain').send('User-agent: *\r\nDisallow: /');
});


// Add controllers
router.use('/area', areaController);


module.exports = router;

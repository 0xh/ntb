import { Router } from 'express';
import morgan from 'morgan';
import _ from 'lodash';

import db from '@turistforeningen/ntb-shared-models';

import processRequest from '../lib/process-request';
import asyncHandler from '../lib/express-async-handler';


const router = new Router();


function createModelRouter(model) {
  const modelRouter = new Router();

  // Find areas
  modelRouter.get('/', asyncHandler(async (req, res, next) => {
    const data = await processRequest(model, req.query);
    res.json(data);
  }));

  return modelRouter;
}


// Access logs
router.use(morgan('combined'));


// robots.txt
router.get('/robots.txt', (req, res, next) => {
  res.type('text/plain').send('User-agent: *\r\nDisallow: /');
});


// Add entry models
Object.values(db.sequelize.models).forEach((model) => {
  if (model.APIEntryModel) {
    const name = _.snakeCase(model.name);
    console.log('******', name);  // eslint-disable-line
    router.use(`/${name}`, createModelRouter(model));
  }
});


module.exports = router;

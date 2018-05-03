import { Router } from 'express';
import morgan from 'morgan';
import _ from 'lodash';
import expressParams from 'express-params';

import db from '@turistforeningen/ntb-shared-models';

import processRequest from '../lib/process-request';
import asyncHandler from '../lib/express-async-handler';


const router = new Router();


function createModelRouter(model) {
  const modelRouter = new Router();
  expressParams.extend(modelRouter);

  // Set frequently used param validators
  const uuidRe = new RegExp(
    [
      '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}',
      '-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
    ].join(''),
    'i'
  );
  modelRouter.param('uuid', uuidRe);

  // Find specific intance
  modelRouter.get('/:uuid', asyncHandler(async (req, res, next) => {
    const id = req.params.uuid[0];
    const data = await processRequest(model, req.query, id);

    if (data === null) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(data);
  }));

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

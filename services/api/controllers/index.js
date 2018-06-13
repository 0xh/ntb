import { Router } from 'express';
import morgan from 'morgan';
import _ from 'lodash';
import uuidValidate from 'uuid-validate';

import * as Models from '@turistforeningen/ntb-shared-models';

import processRequest from '../lib/process-request';
import asyncHandler from '../lib/express-async-handler';


const router = new Router();


function createModelRouter(model) {
  const modelRouter = new Router();

  // Find specific intance
  modelRouter.get('/:id', asyncHandler(async (req, res, next) => {
    if (Array.isArray(model.idColumn)) {
      throw new Error('Multi column identifiers are not supported here');
    }

    const { id } = req.params;
    const formatOptions = model.jsonSchema.properties[model.idColumn];

    // Validate uuid
    if (
      formatOptions.type === 'string'
      && formatOptions.format === 'uuid'
      && id
      && !uuidValidate(id, 4)
    ) {
      return next();
    }

    const data = await processRequest(model, req.query, id);

    if (data === null) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.json(data);
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
Object.values(Models).forEach((model) => {
  if (model.APIEntryModel) {
    const name = _.snakeCase(model.name);
    router.use(`/${name}`, createModelRouter(model));
  }
});


module.exports = router;

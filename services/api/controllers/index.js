import { Router } from 'express';
import morgan from 'morgan';
import _ from 'lodash';
import uuidValidate from 'uuid-validate';

import * as Models from '@turistforeningen/ntb-shared-models';

import processRequest from '../lib/process-request';
import asyncHandler from '../lib/express-async-handler';
import APIError from '../lib/api-error';


const router = new Router();


function createModelRouter(model) {
  const modelRouter = new Router();

  // Find specific document
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

  // Find documents by structured object
  modelRouter.post('/jsonquery', asyncHandler(async (req, res, next) => {
    const queryKeys = Object.keys(req.query);
    if (queryKeys.length) {
      throw new APIError(
        'Invalid query parameters detected. Only a json-object through ' +
        'application/json is allowed.'
      );
    }

    const data = await processRequest(model, req.body, null, false);
    res.json(data);
  }));

  // Find documents
  modelRouter.get('/', asyncHandler(async (req, res, next) => {
    const data = await processRequest(model, req.query, null, true);
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

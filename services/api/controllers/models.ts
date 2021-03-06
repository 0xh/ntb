import uuidValidate from 'uuid-validate';

import { _, uuidTranslator } from '@ntb/utils';
import {
  express,
  Request as ExpressRequest,
} from '@ntb/web-server-utils';
import * as models from '@ntb/models';

import ApiQueryRequest from '../lib/ApiQueryRequest';
import ApiStructuredRequest from '../lib/ApiStructuredRequest';
import expressAsyncHandler from '../lib/expressAsyncHandler';
import DbQuery from '../lib/DbQuery';
import APIError from '../lib/APIError';

import { DbQueryResult } from '../lib/types';

const { Router } = express;
const router = Router();


async function verifyAndExecute(
  model: typeof models.Document,
  requestObject: ExpressRequest,
  type: 'query' | 'structured' = 'query',
  id?: string,
): Promise<DbQueryResult | null> {
  const apiRequest = type === 'query'
    ? new ApiQueryRequest(model, requestObject)
    : new ApiStructuredRequest(model, requestObject);
  if (id) {
    apiRequest.setRequestedId(id);
  }
  apiRequest.verify();

  if (apiRequest.errors.length) {
    throw new APIError(
      'The query is not valid',
      { apiErrors: apiRequest.errors },
    );
  }

  const query = new DbQuery(model, apiRequest);
  const result = await query.execute();

  if (Array.isArray(result) && !result.length) {
    return null;
  }

  return result;
}


function createModelRouter(model: typeof models.Document) {
  const modelRouter = Router();

  // Find specific document using id
  modelRouter.get('/:id', expressAsyncHandler(async (req, res, next) => {
    if (Array.isArray(model.idColumn)) {
      throw new Error('Multi column identifiers are not supported here');
    }

    const { id } = req.params;
    // Skip if model does not have a jsonSchema
    if (!model.idColumnType) {
      return next();
    }

    // Validate uuid
    if (model.idColumnType === 'uuid' && !uuidValidate(id, 4)) {
      return next();
    }

    const data = await verifyAndExecute(model, req.query, 'query', id);

    if (data === null) {
      res.status(404).json({ error: 'Not found' });
    }
    else {
      return res.json(data);
    }
  }));

  // Find specific document using short-uuid
  modelRouter.get('/:shortId', expressAsyncHandler(async (req, res, next) => {
    if (Array.isArray(model.idColumn)) {
      throw new Error('Multi column identifiers are not supported here');
    }

    const { shortId } = req.params;
    // Skip if model does not have a jsonSchema
    if (!model.idColumnType || model.idColumnType !== 'uuid') {
      return next();
    }

    // Validate short-uuid
    let uuid = '';
    try {
      uuid = uuidTranslator.toUUID(shortId);
    }
    catch (e) {
      return next();
    }

    const data = await verifyAndExecute(model, req.query, 'query', uuid);

    if (data === null) {
      res.status(404).json({ error: 'Not found' });
    }
    else {
      return res.json(data);
    }
  }));

  // Find documents by structured object
  modelRouter.post(
    '/jsonquery',
    expressAsyncHandler(async (req, res, _next) => {
      const queryKeys = Object.keys(req.query);
      if (queryKeys.length) {
        throw new APIError(
          'Invalid query parameters detected. Only a json-object through ' +
          'application/json is allowed.',
        );
      }

      const data = await verifyAndExecute(model, req.body, 'structured');
      res.json(data);
    }),
  );

  // Find documents
  modelRouter.get('/', expressAsyncHandler(async (req, res, _next) => {
    const data = await verifyAndExecute(model, req.query, 'query');
    if (data === null) {
      res.json({ message: 'Nothing found' });
    }
    else {
      res.json(data);
    }
  }));

  return modelRouter;
}


// Add entry models
for (const modelName of Object.keys(models)) {
  const name = modelName as keyof typeof models;
  const model = models[name] as typeof models.Document;
  if (model.apiEntryModel) {
    const name = _.snakeCase(model.name);
    router.use(`/${name}`, createModelRouter(model));
  }
}


export default router;

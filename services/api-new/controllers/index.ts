import { _ } from '@ntb/utils';
import { express, morgan } from '@ntb/web-server-utils';
import * as models from '@ntb/models';

import ApiQueryRequest from '../lib/ApiQueryRequest';
import expressAsyncHandler from '../lib/expressAsyncHandler';
// import APIError from '../lib/APIError';


const { Router } = express;
const router = Router();


function createModelRouter(model: typeof models.Document) {
  const modelRouter = Router();

  // Find specific document
  // modelRouter.get('/:id', expressAsyncHandler(async (req, res, next) => {
  //   if (Array.isArray(model.idColumn)) {
  //     throw new Error('Multi column identifiers are not supported here');
  //   }

  //   const { id } = req.params;
  //   // Skip if model does not have a jsonSchema
  //   if (
  //     !model.jsonSchema
  //     || !model.jsonSchema.properties
  //     || !model.jsonSchema.properties[model.idColumn]
  //   ) {
  //     return next();
  //   }
  //   const formatOptions = model.jsonSchema.properties[model.idColumn];

  //   // Validate uuid
  //   if (
  //     formatOptions.type === 'string'
  //     && formatOptions.format === 'uuid'
  //     && id
  //     && !uuidValidate(id, 4)
  //   ) {
  //     return next();
  //   }

  //   const request = new ApiQueryRequest(model, req.query);
  //   const data = request.execute();

  //   if (data === null) {
  //     return res.status(404).json({ error: 'Not found' });
  //   }

  //   return res.json(data);
  // }));

  // Find documents by structured object
  // modelRouter.post(
  //   '/jsonquery',
  //   // tslint:disable-next-line
  //   expressAsyncHandler(async (req, res, _next) => {
  //     const queryKeys = Object.keys(req.query);
  //     if (queryKeys.length) {
  //       throw new APIError(
  //         'Invalid query parameters detected. Only a json-object through ' +
  //         'application/json is allowed.',
  //       );
  //     }

  //     const data = await processRequest(model, req.body, null, false);
  //     res.json(data);
  //   }),
  // );

  // Find documents
  // tslint:disable-next-line
  modelRouter.get('/', expressAsyncHandler(async (req, res, _next) => {
    const request = new ApiQueryRequest(model, req.query);
    const data = request.execute();
    res.json(data);
  }));

  return modelRouter;
}


// Access logs
router.use(morgan('combined'));


// robots.txt
  // tslint:disable-next-line
router.get('/robots.txt', (_req, res, _next) => {
  res.type('text/plain').send('User-agent: *\r\nDisallow: /');
});


// Add entry models
Object.keys(models).forEach((modelName: string) => {
  const model: typeof models.Document = models[modelName];
  if (model.apiEntryModel) {
    const name = _.snakeCase(model.name);
    router.use(`/${name}`, createModelRouter(model));
  }
});


export default router;

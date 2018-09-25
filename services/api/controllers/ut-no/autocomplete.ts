import { express } from '@ntb/web-server-utils';
import { knex } from '@ntb/db-utils';

import expressAsyncHandler from '../../lib/expressAsyncHandler';
import ApiStructuredRequest from '../../lib/ApiStructuredRequest';
import DbQuery from '../../lib/DbQuery';
import APIError from '../../lib/APIError';

import { Cabin, Poi, Trip } from '@ntb/models';


type ao = { [key: string]: any };
type modelType = typeof Cabin | typeof Poi | typeof Trip;


const { Router } = express;
const router = Router();


router.get('/', expressAsyncHandler(async (req, res, _next) => {
  const rawQuery = req.query.q;

  if (typeof rawQuery !== 'string') {
    res.json({});
    return;
  }

  const q = rawQuery.trim().toLowerCase();
  if (!q) {
    res.json({});
    return;
  }

  const result = await searchDb(q);
  res.json(result);
}));


async function searchDb(q: string): Promise<ao> {
  const result = await knex('unique_names')
    .select('nameLowerCase', 'documentType')
    .where('nameLowerCase', 'like', `${q}%`)
    .limit(5)
    .orderBy('documentType', 'asc')
    .orderBy('nameLowerCase', 'asc');

  const data: ao = {};
  let exact: string = '';
  if (result && result.length) {
    for (const row of result) {
      if (row.nameLowerCase === q && !exact) {
        exact = row.documentType;
      }
      else if (row.nameLowerCase !== q) {
        if (!data.autocomplete) {
          data.autocomplete = [];
        }
        data.autocomplete.push(row.nameLowerCase);
      }
    }
  }

  if (exact) {
    let model: modelType = Cabin;
    if (exact === 'trip') {
      model = Trip;
    }
    else if (exact === 'poi') {
      model = Poi;
    }

    const document = await getDocument(model, q);
    if (document) {
      data.document = document;
    }
  }

  return data;
}


async function getDocument(model: modelType, q: string) {
  const requestObject = {
    limit: 1,
    filters: [
      ['name', q],
    ],
    fields: ['id', 'name'],
  };
  const apiRequest = new ApiStructuredRequest(model, requestObject);
  apiRequest.verify();

  if (apiRequest.errors.length) {
    throw new APIError(
      'The query is not valid',
      { apiErrors: apiRequest.errors },
    );
  }

  const query = new DbQuery(model, apiRequest);
  const result = await query.execute() as ao;

  if (!result || !result.count || !result.documents) {
    return null;
  }

  return result.documents[0];
}


export default router;

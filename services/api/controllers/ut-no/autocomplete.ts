import { express } from '@ntb/web-server-utils';
import { knex } from '@ntb/db-utils';

import expressAsyncHandler from '../../lib/expressAsyncHandler';
import ApiStructuredRequest from '../../lib/ApiStructuredRequest';
import DbQuery from '../../lib/DbQuery';
import APIError from '../../lib/APIError';

import { Cabin, Poi, Trip, Route, Area } from '@ntb/models';


type ao = { [key: string]: any };
type modelType =
  | typeof Cabin
  | typeof Poi
  | typeof Route
  | typeof Area
  | typeof Trip;


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

  if (q.split(' ').length > 6) {
    res.json({});
    return;
  }

  const [autocomplete, document] = await Promise.all([
    searchDbForAutocomplete(q),
    searchDbForExactMatch(q),
  ]);

  res.json({
    ...(autocomplete ? { autocomplete } : {}),
    ...(document ? { document } : {}),
  });
}));


async function searchDbForExactMatch(q: string): Promise<ao | null> {
  const result = await knex('unique_names')
    .select(
      'name',
      'areaIds',
      'cabinIds',
      'poiIds',
      'tripIds',
      'routeIds',
    )
    .where('name', '=', q)
    .limit(1)
    .orderBy('autocompleteRank', 'desc');

  if (result && result.length) {
    const [documentType, ids] = getExactIds(result[0]);
    if (documentType && ids) {
      return getDocument(q, documentType, ids);
    }
  }

  return null;
}


async function searchDbForAutocomplete(q: string): Promise<ao | null> {
  const result = await knex('unique_names')
    .select(
      'name',
      knex.raw('ts_rank(search_nb, full_text_phrase)'),
    )
    .joinRaw(
      "JOIN to_tsquery('simple', ?) AS full_text_phrase ON TRUE",
      q.split(' ').map((a) => `${a}:*`).join(' & '),
    )
    .whereRaw('full_text_phrase @@ search_nb')
    .where('name', '<>', q)
    .where('autocompleteRank', '>', 0)
    .limit(5)
    .orderBy('fullTextPhrase', 'desc')
    .orderBy('autocompleteRank', 'desc');

  if (result && result.length) {
    return result.map((r: ao) => r.name);
  }

  return null;
}


function getExactIds(row: ao): [string | null, string[] | null] {
  for (const type of ['area', 'cabin', 'poi', 'trip', 'route']) {
    const ids: string[] = row[`${type}Ids`];
    if (ids && ids.length) {
      return [type, ids];
    }
  }

  return [null, null];
}


async function getDocument(
  q: string,
  documentType: string,
  documentIds: string[],
) {
  const model = getModelClass(documentType);
  const idsFilter = documentIds.length > 1
    ? `"${documentIds.join('","')}"`
    : documentIds[0];
  const requestObject = {
    limit: 1,
    filters: [
      ['name', q],
      ['id', idsFilter],
    ],
    fields: [
      'id',
      'name',
      documentType === 'route' ? 'description_ab_plain' : 'description_plain',
    ],
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

  const document = {
    ...result.documents[0],
    document_type: documentType,
  };

  if (result.documents[0].description_plain) {
    const plain = result.documents[0].description_plain;
    document.description = plain.slice(0, 150);
    document.description_complete =
      !(document.description.length < plain.length);
    delete document.description_plain;
  }

  return document;
}


function getModelClass(documentType: string): modelType {
  if (documentType === 'poi') return Poi;
  if (documentType === 'trip') return Trip;
  if (documentType === 'route') return Route;
  if (documentType === 'area') return Area;
  return Cabin;
}


export default router;

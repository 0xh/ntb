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

  const [autocompleteData, documentData] = await Promise.all([
    searchDbForAutocomplete(q),
    searchDbForExactMatch(q),
  ]);
  const autocomplete = autocompleteData ? autocompleteData.autocomplete : null;

  // If no exact document is found, and only one autocomplete
  const document = !documentData && autocompleteData && autocompleteData.ids
    ? await processIdsRow(autocompleteData.ids)
    : documentData;

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
    return await processIdsRow(result[0]);
  }

  return null;
}


async function processIdsRow(row: ao) {
  const [documentType, ids] = getExactIds(row);
  if (documentType && ids) {
    return await getDocument(documentType, ids);
  }
  return null;
}


async function searchDbForAutocomplete(q: string): Promise<ao | null> {
  const result = await knex('unique_names')
    .select(
      'name',
      // knex.raw('ts_rank(search_nb, full_text_phrase) as rank'),
      'cabin_ids',
      'poi_ids',
      'route_ids',
      'trip_ids',
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
    return {
      autocomplete: result.map((r: ao) => r.name),
      ids: result.length === 1 ? result[0] : null,
    };
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
  documentType: string,
  documentIds: string[],
) {
  const model = getModelClass(documentType);
  const requestObject = {
    fields: [
      'id',
      'name',
      documentType === 'route' ? 'description_ab_plain' : 'description_plain',
    ],
  };
  const apiRequest = new ApiStructuredRequest(model, requestObject);
  apiRequest.setRequestedId(documentIds[0]).verify();

  if (apiRequest.errors.length) {
    throw new APIError(
      'The query is not valid',
      { apiErrors: apiRequest.errors },
    );
  }

  const query = new DbQuery(model, apiRequest);
  const result = await query.execute() as ao;

  if (!result) {
    return null;
  }

  const document: ao = {
    ...result,
    document_type: documentType,
  };

  if (result.description_plain) {
    const plain = result.description_plain;
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

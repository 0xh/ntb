import { express, Request } from '@ntb/web-server-utils';
import SearchDocument from '@ntb/models/SearchDocument';
import { knex } from '@ntb/db-utils';
import { Cabin, Trip, Route, Poi } from '@ntb/models';
import { DbQueryResult } from '../../lib/types';

import expressAsyncHandler from '../../lib/expressAsyncHandler';
import APIError from '../../lib/APIError';
import ApiStructuredRequest from '../../lib/ApiStructuredRequest';
import DbQuery from '../../lib/DbQuery';


const { Router } = express;
const router = Router();


type documentType = 'cabin' | 'trip' | 'poi' | 'route';
interface Counts {
  cabin: number;
  route: number;
  poi: number;
  trip: number;
}
interface SelectedAndCounts {
  selected: documentType | null;
  counts: Counts;
}
interface RankRow {
  [key: string]: string | number;
}
interface ApiResult {
  counts: Counts;
  selected?: documentType;
  documents?: DbQueryResult | null;
}

/**
 * For the main full text search
 * Attempts to find the document type with the best score for the specified
 * query.
 * Support pagination parameters.
 * Does not support document specific filters.
 */
router.get('/', expressAsyncHandler(async (req, res, _next) => {
  const { q, language } = validateInput(req);
  let documents: DbQueryResult | null = null;

  const result = q
    ? await runRankQuery(q, language)
    : await runEmptyCountQuery();
  const selectedAndCounts = getSelectedAndCounts(result);

  if (selectedAndCounts.selected) {
    documents = await runDocumentQuery(selectedAndCounts.selected, q);
  }

  const apiResult: ApiResult = {
    counts: selectedAndCounts.counts,
  };
  if (selectedAndCounts.selected) {
    apiResult.selected = selectedAndCounts.selected;
    apiResult.documents = documents;
  }

  res.json({
    ...selectedAndCounts,
    documents,
  });
}));


async function runDocumentQuery(selected: documentType, q: string | null) {
  let model: typeof Cabin | typeof Trip | typeof Route | typeof Poi = Cabin;
  if (selected === 'trip') model = Trip;
  if (selected === 'route') model = Route;
  if (selected === 'poi') model = Poi;

  const requestObject = q ? { q } : {};

  const apiRequest = new ApiStructuredRequest(model, requestObject);
  apiRequest.verify();

  if (apiRequest.errors.length) {
    throw new Error('The query is not valid');
  }

  const query = new DbQuery(model, apiRequest);
  const result = await query.execute();

  return result;
}


async function runRankQuery(
  q: string,
  language: string | null,
): Promise<RankRow[]> {
  const fullTextField = getSearchAttributeName(language);
  const result = await SearchDocument.query()
    .select(
      'documentType',
      knex.raw(`
        MAX(
          ts_rank(${fullTextField}, full_text_phrase)
          * search_document_boost
          * search_document_type_boost
        ) AS full_text_rank
      `.trim().replace(/\s{2,}/g, ' ')),
    )
    .count('*')
    .joinRaw(
      "JOIN plainto_tsquery('norwegian', ?) AS full_text_phrase ON TRUE",
      q,
    )
    .whereRaw(`full_text_phrase @@ ${fullTextField}`)
    .whereIn('documentType', ['cabin', 'trip', 'poi', 'route'])
    .groupBy('documentType')
    .orderBy('full_text_rank', 'desc');

  return result as any as RankRow[];
}


function getSelectedAndCounts(
  dbResult: RankRow[],
  forceSelected: documentType | null = null,
): SelectedAndCounts {
  const counts: Counts = {
    cabin: 0,
    trip: 0,
    route: 0,
    poi: 0,
  };

  let first: keyof Counts | null = null;
  for (const row of dbResult) {
    const documentType = row.documentType as keyof Counts;
    if (!first) {
      first = documentType as documentType;
    }

    counts[documentType] = +row.count;
  }

  return {
    counts,
    selected: forceSelected || first,
  };
}


async function runEmptyCountQuery() {
  const result = await SearchDocument.query()
    .select(
      'documentType',
    )
    .count('*')
    .whereIn('documentType', ['cabin', 'trip', 'poi', 'route'])
    .groupBy('documentType');

  return result as any as RankRow[];
}


function validateInput(
  req: Request,
): { q: string | null, language: string | null } {
  const rawQ = req.query.q;
  const rawLanguage = req.query.language;

  if (rawQ !== undefined && typeof rawQ !== 'string') {
    throw new APIError("Invalid value of 'q'");
  }

  if (rawLanguage !== undefined && typeof rawLanguage !== 'string') {
    throw new APIError("Invalid value of 'language'");
  }

  const q = rawQ ? rawQ.trim().toLowerCase() : null;
  const language = rawLanguage ? rawLanguage.trim().toLowerCase() : null;

  if (language && !['nb', 'en'].includes(language)) {
    throw new APIError(
      "Invalid value of 'language'. 'nb' or 'en' are valid values");
  }

  return { q, language };
}


function getSearchAttributeName(language: string | null): string {
  return language === 'en' ? 'search_en' : 'search_nb';
}


export default router;

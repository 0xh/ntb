import { express, Request } from '@ntb/web-server-utils';
import { Cabin, Poi, Trip } from '@ntb/models';
import { uuidTranslator } from '@ntb/utils';

import expressAsyncHandler from '../../../lib/expressAsyncHandler';
import APIError from '../../../lib/APIError';
import ApiQueryRequest from '../../../lib/ApiQueryRequest';
import DbQuery from '../../../lib/DbQuery';


type ao = { [key: string]: any };
type modelName = 'cabin' | 'trip' | 'poi';
type modelTypes = typeof Cabin | typeof Poi | typeof Trip;


const { Router } = express;
const router = Router();

const API_REQUEST_OPTIONS = {
  cabin: {
    fields: 'id,coordinates,service_level,dnt_cabin',
    // coordinates: '',
  },
  trip: {
    fields: 'id,activity_type,grading,starting_point',
    starting_point: '',
  },
  poi: {
    fields: 'id,type,coordinates,poi_types',
    coordinates: '',
  },
};


router.get('/cabin', expressAsyncHandler(async (req, res, _next) => {
  const result = await createResult(req, Cabin, 'cabin');
  res.send(result);
}));

router.get('/poi', expressAsyncHandler(async (req, res, _next) => {
  const result = await createResult(req, Poi, 'poi');
  res.send(result);
}));

router.get('/trip', expressAsyncHandler(async (req, res, _next) => {
  const result = await createResult(req, Trip, 'trip');
  res.send(result);
}));


async function createResult(
  req: Request,
  model: modelTypes,
  modelName: modelName,
) {
  const modelOptions = API_REQUEST_OPTIONS[modelName];
  const result = await runRequest(req, model, modelOptions);
  if (!result || !result.count || !result.documents) {
    return '';
  }

  const data = [];
  for (const row of result.documents) {
    const key = row.coordinates ? 'coordinates' : 'starting_point';
    const line = [
      uuidTranslator.fromUUID(row.id),
      row[key].coordinates.map((c: number) => c.toFixed(6)).join(','),
    ];

    // Icon
    if (modelName === 'cabin') {
      line.push(getCabinIcon(row));
    }
    else if (modelName === 'poi') {
      line.push(getPoiIcon(row));
    }
    else {
      line.push(getTripIcon(row));
    }

    data.push(line.join(';'));
  }

  return data.join('\n');
}


async function runRequest(req: Request, model: modelTypes, modelOptions: ao) {
  const queryKeys = Object.keys(req.query);
  if (queryKeys.includes('limit') || queryKeys.includes('offset')) {
    throw new APIError(
      'Pagination parameters (limit, offset) are not allowed',
    );
  }
  if (queryKeys.includes('fields')) {
    throw new APIError(
      'fields parameters is not allowed',
    );
  }

  const requestObject: ao = {
    ...(req.query || {}),
    ...modelOptions,
  };

  const apiRequest = new ApiQueryRequest(model, requestObject);
  apiRequest.verify();

  if (apiRequest.errors.length) {
    throw new APIError(
      'The query is not valid',
      { apiErrors: apiRequest.errors },
    );
  }

  apiRequest.queryOptions.limit = 60000;
  const query = new DbQuery(model, apiRequest);
  const result = await query.execute();

  if (Array.isArray(result) && !result.length) {
    return null;
  }

  return result;
}


function getCabinIcon(row: ao): string {
  return `${row.dnt_cabin ? 'dnt' : 'private'}__${
    (row.service_level || 'unknown').replace(/ /g, '_')}`;
}


function getPoiIcon(row: ao): string {
  return row.type.replace(/ /g, '_');
}


function getTripIcon(row: ao): string {
  return `${row.activity_type.replace(/ /g, '_')}__${
    row.grading.replace(/ /g, '_')}`;
}


export default router;

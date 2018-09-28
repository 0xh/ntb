import {
  express,
  Request,
  Response,
  NextFunction,
} from '@ntb/web-server-utils';
import { Cabin, Poi, Trip } from '@ntb/models';
import { uuidTranslator, Logger, _ } from '@ntb/utils';

import expressAsyncHandler from '../../../lib/expressAsyncHandler';
import APIError from '../../../lib/APIError';
import ApiQueryRequest from '../../../lib/ApiQueryRequest';
import DbQuery from '../../../lib/DbQuery';
import { DbQueryRow } from '../../../lib/types';
import spec, { htgtSpec } from './spec';


type ao = { [key: string]: any };
type modelName = 'cabin' | 'trip' | 'poi';
type modelTypes = typeof Cabin | typeof Poi | typeof Trip;


const { Router } = express;
const router = Router();
const logger = Logger.getLogger();


// CABIN
router.get('/cabin', expressAsyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const result = await createResult(req, Cabin, 'cabin');
  res.send(result);
}));

// POI
router.get('/poi', expressAsyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const result = await createResult(req, Poi, 'poi');
  res.send(result);
}));

// TRIP
router.get('/trip', expressAsyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const result = await createResult(req, Trip, 'trip');
  res.send(result);
}));


// SPEC
router.get('/spec', (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.json(snakeCaseSpecKeys(spec));
});


/*
 * HELPERS --------------------------------------------------------------------
 */


const API_REQUEST_OPTIONS = {
  cabin: {
    fields: (
      'id,coordinates,service_level,dnt_cabin,facilities,beds,htgt'
    ),
    coordinates: '',
  },
  trip: {
    fields: 'id,activity_type,grading,starting_point,duration',
    starting_point: '',
  },
  poi: {
    fields: 'id,type,coordinates',
    coordinates: '',
  },
};


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

  if (modelName === 'cabin') {
    const data = processCabins(result);
    return data.join('\n');
  }
  if (modelName === 'poi') {
    const data = processPois(result);
    return data.join('\n');
  }
  const data = processTrips(result);
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


function processCabins(result: DbQueryRow): string[] {
  const data: string[] = [];
  for (const row of result.documents) {
    const line: (string | undefined)[] = [
      uuidTranslator.fromUUID(row.id),
      row.coordinates.coordinates
        .map((c: number) => +(c.toFixed(6))).join(','),
    ];

    // Is DNT
    line.push(spec.cabin.isDnt[row.dnt_cabin ? 'true' : 'false']);
    // Service level
    line.push(spec.cabin.serviceLevel[row.service_level || 'unknown']);
    // Beds today
    line.push(
      row.beds
        ? row.beds.today || ''
        : '',
    );
    // Facilities
    const facilities = processFacilities(row);
    line.push(facilities || '');
    // htgt
    const htgt = processHtgt(row);
    line.push(htgt || '');

    // Safe guard for undefined
    if (line.some((v) => v === undefined)) {
      logger.warn('** Found undefined value **');
      continue;
    }

    data.push(line.join(';'));
  }

  return data;
}


function processPois(result: DbQueryRow): string[] {
  const data: string[] = [];
  for (const row of result.documents) {
    const line: (string | undefined)[] = [
      uuidTranslator.fromUUID(row.id),
      row.coordinates.coordinates
        .map((c: number) => +(c.toFixed(6))).join(','),
    ];

    // type
    line.push(spec.poi.type[row.type]);

    // Safe guard for undefined
    if (line.some((v) => v === undefined)) {
      logger.warn('** Found undefined value **');
      continue;
    }

    data.push(line.join(';'));
  }

  return data;
}


function processTrips(result: DbQueryRow): string[] {
  const data: string[] = [];
  for (const row of result.documents) {
    const line: (string | undefined)[] = [
      uuidTranslator.fromUUID(row.id),
      row.starting_point.coordinates
        .map((c: number) => +(c.toFixed(6))).join(','),
    ];

    // activity_type
    line.push(spec.trip.activityType[row.activity_type]);
    // grading
    line.push(spec.trip.grading[row.grading]);
    // durationMinutes
    const durationMinutes = processDurationMinutes(row);
    line.push(durationMinutes || '');
    // durationDays
    const durationDays = processDurationDays(row);
    line.push(durationDays || '');

    // Safe guard for undefined
    if (line.some((v) => v === undefined)) {
      logger.warn('** Found undefined value **');
      continue;
    }

    data.push(line.join(';'));
  }

  return data;
}


function processFacilities(row: ao) {
  if (row.facilities) {
    const facilities: (string | undefined)[] = [];
    for (const { name } of row.facilities) {
      facilities.push(spec.cabin.facility[name]);
    }

    // Safe guard for undefined
    if (facilities.some((v) => v === undefined)) {
      logger.warn('** Found undefined value in facilities **');
      return null;
    }

    return facilities.join('');
  }
  return null;
}


function processHtgt(row: ao) {
  if (row.htgt) {
    const htgt: (string)[] = [];

    if (row.htgt.carAllYear) htgt.push(htgtSpec.carAllYear);
    if (row.htgt.carSummer) htgt.push(htgtSpec.carSummer);
    if (row.htgt.bicycle) htgt.push(htgtSpec.bicycle);
    if (row.htgt.publicTransportAvailable) {
      htgt.push(htgtSpec.publicTransportAvailable);
    }
    if (row.htgt.boatTransportAvailable) {
      htgt.push(htgtSpec.boatTransportAvailable);
    }

    return htgt.join('');
  }
  return null;
}


function processDurationMinutes(row: ao) {
  if (row.duration && (row.duration.minutes || row.duration.hours)) {
    let duration: number = 0;

    if (row.duration.minutes) {
      duration += row.duration.minutes;
    }
    if (row.duration.hours) {
      duration += (row.duration.hours * 60);
    }

    return `${duration}`;
  }
  return null;
}


function processDurationDays(row: ao) {
  if (row.duration && row.duration.days) {
    return `${row.duration.days}`;
  }
  return null;
}


function snakeCaseSpecKeys(spec: ao) {
  const newSpec: ao = {};
  for (const key of Object.keys(spec)) {
    let value: any = spec[key];

    if (
      !['serviceLevel'].includes(key)
      && !Array.isArray(value)
      && typeof value === 'object'
    ) {
      value = snakeCaseSpecKeys(value);
    }

    if (key === 'orderOfFields') {
      value = value.map((v: string) => _.snakeCase(v));
    }

    newSpec[_.snakeCase(key)] = value;
  }
  return newSpec;
}


export default router;

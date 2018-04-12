import { Router } from 'express';

import db from '@turistforeningen/ntb-shared-models';
import { createLogger } from '@turistforeningen/ntb-shared-utils';

import APIError from '../../lib/APIError';
import {
  validateLimit,
  validateOffset,
} from '../../lib/request-options-validator';
import requestProcesser from '../../lib/request-processer';
import asyncHandler from '../../lib/express-async-handler';


const logger = createLogger();
const router = new Router();

const orderMapping = {
  updated_at: 'updatedAt',
  created_at: 'createdAt',
  name: 'name',
};


function getValidOrderMapping(requestOptions) {
  const valid = Object.keys(orderMapping);
  const order = requestOptions.order
    ? requestOptions.order.toLowerCase()
    : null;
  const direction = requestOptions.order_direction
    ? requestOptions.order_direction.toUpperCase()
    : 'ASC';

  if (!['ASC', 'DESC'].includes(direction)) {
    throw new Error('Invalid order_direction parameter value');
  }

  if (valid.includes(order)) {
    return [[orderMapping[order], direction]];
  }
  else if (order !== null) {
    throw new Error('Invalid order parameter value');
  }

  // Default value
  return [['updatedAt', 'DESC']];
}


function processFields(requestOptions) {
  const areaApiConfig = db.Area.getAPIConfig(db);
  let attributes;

  if (!requestOptions.fields) {
    attributes = areaApiConfig.fields.filter((f) => f !== 'uri');
  }
  else {
    // Validate that the fields exist
    attributes = requestOptions.fields.map((field) => {
      if (!areaApiConfig.fields.includes(field)) {
        throw new Error(`Invalid field '${field}'`);
      }

      return field;
    });
  }

  return {
    attributes,
  };
}


const requestParameters = {
  limit: 3,
  offset: 0,
  order: 'updated_at',
  fields: [
    'name',
    'uuid',
  ],
  e: {
    parent: {
      fields: [
        'name',
        'description',
      ],
    },
  },
};


// Find areas
router.get('/', asyncHandler(async (req, res, next) => {
  // const { attributes } = processFields(requestOptions);

  // const queryOptions = {
  //   limit: validateLimit(requestOptions),
  //   offset: validateOffset(requestOptions),
  //   order: getValidOrderMapping(requestOptions),
  //   attributes,

  //   logging: (sql, duration, options) => {
  //     logger.debug(sql);
  //     logger.debug(JSON.stringify(options));
  //   },
  // };

  // db.Area.findAll(queryOptions).then((areas) => {
  //   const result = {
  //     areas: areas.map((area) => db.Area.format(area)),
  //   };

  //   res.json(result);
  // });

  const data = await requestProcesser(requestParameters, db.Area);
  res.json(data);
}));

module.exports = router;

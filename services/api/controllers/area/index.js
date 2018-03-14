import { Router } from 'express';

import db from '@turistforeningen/ntb-shared-models';
import { createLogger } from '@turistforeningen/ntb-shared-utils';

import {
  validateLimit,
  validateOffset,
} from '../../lib/query-validator';


const logger = createLogger();
const router = new Router();

const orderMapping = {
  updated_at: 'updatedAt',
  created_at: 'createdAt',
  name: 'name',
};


function getValidOrderMapping(query) {
  const valid = Object.keys(orderMapping);
  const order = query.order ? query.order.toLowerCase() : null;
  const direction = query.order_direction
    ? query.order_direction.toUpperCase()
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


// Find areas
router.get('/', (req, res, next) => {
  const queryOptions = {
    limit: validateLimit(req.query),
    offset: validateOffset(req.query),
    order: getValidOrderMapping(req.query),

    logging: (sql, duration, options) => {
      logger.debug(sql);
      logger.debug(JSON.stringify(options));
    },
  };

  db.Area.findAll(queryOptions).then((areas) => {
    const result = {
      areas: areas.map((area) => db.Area.format(area)),
    };

    res.json(result);
  });
});

module.exports = router;

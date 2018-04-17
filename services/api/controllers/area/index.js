import { Router } from 'express';

import db from '@turistforeningen/ntb-shared-models';
import { createLogger } from '@turistforeningen/ntb-shared-utils';

import processRequest from '../../lib/process-request';
import asyncHandler from '../../lib/express-async-handler';


const logger = createLogger();
const router = new Router();


// Find areas
router.get('/', asyncHandler(async (req, res, next) => {
  const data = await processRequest(db.Area, req.query);
  res.json(data);
}));

module.exports = router;

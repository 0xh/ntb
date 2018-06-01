import { Router } from 'express';

import version from '../../version';


const router = new Router();


// Return version
router.get('/', (req, res, next) => {
  res.json({ version: version.tag });
});


module.exports = router;

import { Router } from 'express';

import sherpa from '../../lib/sherpa';


const router = new Router();


// Return version
router.get('/', (req, res, next) => {
  sherpa.client.get('schema/?format=json')
    .then((data) => {
      res.json({ schema: data });
    })
    .catch((err) => {
      res.json({ error: 'sherpa-api-error', err });
    });
});


export default router;

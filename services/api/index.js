import bodyParser from 'body-parser';
import express from 'express';

import { createLogger } from '@turistforeningen/ntb-shared-utils';

import controllers from './controllers';


const logger = createLogger();


// Initiate express app
const app = express();

app.set('x-powered-by', false);
app.set('etag', false);

app.use(bodyParser.json());


// Set the base router
app.use('/', controllers);


// Error handler
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
  });
});


// Start the express app
if (!module.parent) {
  const port = 3000;

  app.listen(port);
  logger.info(`Server listening on port ${port}`);
}

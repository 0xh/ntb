import bodyParser from 'body-parser';
import express from 'express';

import { ENV_IS_DEVELOPMENT } from '@turistforeningen/ntb-shared-settings';
import { createLogger } from '@turistforeningen/ntb-shared-utils';

import APIError from './lib/APIError';
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
  const data = {};

  // If it's an APIError
  data.error = err instanceof APIError
    ? err.message
    : 'Oops, an unknown error occured! We\'re on it!';

  if (ENV_IS_DEVELOPMENT) {
    data.debug = {
      message: err.message,
      stack: err.stack.split(/\n/g),
    };
  }

  res.status(500).json(data);
});


// Start the express app
if (!module.parent) {
  const port = 3000;

  app.listen(port);
  logger.info(`Server listening on port ${port}`);
}

import bodyParser from 'body-parser';
import express from 'express';

import settings from '@ntb/shared-settings';
import { createLogger } from '@ntb/shared-utils';

import APIError from './lib/api-error';
import controllers from './controllers';


const { ENV_IS_DEVELOPMENT } = settings;
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
  const data = { error: 'Oops, an unknown error occured! We\'re on it!' };
  let code = 500;

  // If it's a syntax error parsing json
  if (err instanceof SyntaxError) {
    code = 400;
    data.error = 'Unable to parse your request. Malformed application/json?';
  }

  // If it's an APIError
  else if (err instanceof APIError) {
    code = 400;
    data.error = err.message;

    // Add any listed API errors
    if (err.apiErrors) {
      data.errorDetails = err.apiErrors;
    }
  }

  else {
    logger.warn(err.message);
    logger.warn(err.stack);
  }

  // Add stack trace if it's the development environment
  if (ENV_IS_DEVELOPMENT) {
    data.debug = {
      message: err.message,
      stack: err.stack.split(/\n/g),
    };
  }

  res.status(code).json(data);
});


// Start the express app
if (!module.parent) {
  const port = 3000;

  app.listen(port);
  logger.info(`Server listening on port ${port}`);
}

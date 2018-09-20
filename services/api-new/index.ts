import {
  express,
  bodyParser,
  Request,
  Response,
  NextFunction,
} from '@ntb/web-server-utils';

import settings from '@ntb/settings';
import { Logger } from '@ntb/utils';

import APIError from './lib/APIError';
import controllers from './controllers';


const { ENV_IS_DEVELOPMENT } = settings;
const logger = Logger.getLogger();

// Initiate express app
const app = express();

app.set('x-powered-by', false);
app.set('etag', false);

app.use(bodyParser.json());


// Set the base router
app.use('/', controllers);


// Error handler

interface ErrorData {
  error: string;
  errorDetails?: string[];
  debug?: {
    message: string,
    stack: string[],
  };
}

// tslint:disable-next-line
app.use((err: Error | APIError, _req: Request, res: Response, _next: NextFunction) => {
  const data: ErrorData = {
    error: "Oops, an unknown error occured! We're on it!",
  };
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

  // Add stack trace if it's the development environment
  if (ENV_IS_DEVELOPMENT) {
    data.debug = {
      message: err.message,
      stack: err.stack ? err.stack.split(/\n/g) : [],
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

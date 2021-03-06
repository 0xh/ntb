import path from 'path';

import { settings } from '@ntb/settings';
import {
  express,
  bodyParser,
  nunjucks as _nunjucks,
  Raven,
} from '@ntb/web-server-utils';

import NunjuckCustomWebLoader from './utils/nunjucks-custom-web-loader';
import environment from './lib/environment';
import version from './version';
import controllers from './controllers';


const { Environment, FileSystemLoader } = _nunjucks;
const useRaven = environment.production && settings.SERVICES_ADMIN_SENTRY_DSN;


// Initialize Raven
if (useRaven) {
  Raven.config(settings.SERVICES_ADMIN_SENTRY_DSN).install();
}

// Initiate express app and set Raven request handler
const app = express();
if (useRaven) {
  app.use(Raven.requestHandler());
}

app.set('x-powered-by', false);
app.set('etag', false);

app.use(bodyParser.json());


// Serve assests
// Assets are built through Webpack and will be loaded using webpack dev server
// when in development mode
const assetsFolder = path.resolve(__dirname, '..', 'assets');
app.use('/assets', express.static(assetsFolder));

// Configure nunjucks template engine
const nunjucksOptions = {
  autoescape: true,
  noCache: environment.ifProduction(false, true),
};

const templatesFolder = path.resolve(__dirname, '..', 'templates');
const nunjucksEnvironment = new Environment(
  environment.ifProduction(
    new FileSystemLoader(templatesFolder, nunjucksOptions),
    new NunjuckCustomWebLoader(
      'templates',
      nunjucksOptions
    )
  )
);

// Set express app on the Nunjucks environment
nunjucksEnvironment.express(app);

// Set global template variables
nunjucksEnvironment
  .addGlobal('GA_CODE', settings.SERVICES_ADMIN_GA_CODE)
  .addGlobal('GTM_CODE', settings.SERVICES_ADMIN_GTM_CODE)
  .addGlobal('IS_PRODUCTION', environment.ifProduction(true, false))
  .addGlobal('IS_DEVELOPMENT', environment.ifDevelopment(true, false));

version.promise.then((tag) => {
  nunjucksEnvironment.addGlobal('VERSION', tag);
}).catch(() => {});

// Set the base router
app.use('/', controllers);

// Add Raven error handler
if (useRaven) {
  app.use(Raven.errorHandler());
}

// Fallthrough error handler
app.use((err, req, res, next) => {
  res.statusCode = 500;
  if (environment.production) {
    res.end(res.sentry);
  }
  else {
    next(err);
  }
});

// Start the express app
if (!module.parent) {
  const port = settings.SERVICES_ADMIN_PORT || 8080;

  app.listen(port);
  console.log(`Server listening on port ${port}`);
}


export default app;
export const nunjucks = nunjucksEnvironment;

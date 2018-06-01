import { Router } from 'express';
import morgan from 'morgan';

import authController from './auth';
import apiController from './api';
import environment from '../lib/environment';


const router = new Router();

// Access logs
router.use(morgan('combined'));


router.get('/robots.txt', (req, res, next) => {
  res.type('text/plain').send('User-agent: *\r\nDisallow: /');
});


// Add controllers
router.use('/o', authController);
router.use('/api', apiController);


// Return React app if user is authenticated or redirect to login
router.get('*', (req, res, next) => {
  const context = {};

  if (res.locals.OAuthTokens) {
    context.OAuthTokens = JSON.stringify({
      access_token: res.locals.OAuthTokens.access_token,
      refresh_token: res.locals.OAuthTokens.refresh_token,
    });
  }

  const tpl = environment.production
    ? 'app.html'
    : 'to-be-compiled-by-webpack/app.html';
  res.render(tpl, context);
});


module.exports = router;

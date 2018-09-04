import { Router } from 'express';
import querystring from 'querystring';

import settings from '@ntb/shared-settings';

import sherpa from '../lib/sherpa';


const router = new Router();


// Forward user to DNT Connect
router.get('/forward', (req, res, next) => {
  const redirectUri = (
    `${req.protocol}://${req.hostname}${req.baseUrl}` +
    `/verify?next=${req.query.next || ''}`
  );

  return res.redirect(
    `${settings.SERVICES_ADMIN_OAUTH_DOMAIN}/o/authorize/?client_id=` +
    `${settings.SERVICES_ADMIN_OAUTH_CLIENT_ID}&response_type=code` +
    `&redirect_uri=${redirectUri}`
  );
});


// Verify respons from DNT Connect
router.get('/verify', (req, res, next) => {
  if (req.query.error) {
    // TODO(Roar): Handle login errors in some way...
    res.redirect(`/login-error?${querystring.stringify(req.query)}`);
  }
  else {
    const { code, next: nextUrl } = req.query;
    const redirectUri = (
      `${req.protocol}://${req.hostname}${req.baseUrl}/verify` +
      `?next=${nextUrl || ''}`
    );
    const body = (
      `grant_type=authorization_code&code=${code}` +
      `&redirect_uri=${redirectUri}`
    );

    sherpa.client.tokenRequest(body)
      .then((result) => result.json())
      .then((tokens) => {
        res.locals.OAuthTokens = tokens;
        next();
      })
      .catch((err) => {
        // TODO(Roar): Handle login errors in some way...
        console.log(err);
        res.redirect('/login-error?unabletoauth=1');
      });
  }
});


module.exports = router;

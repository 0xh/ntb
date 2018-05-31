import { Router } from 'express';

import User from '../../models/User';


const router = new Router();


// Helpers
const setTokenHeaders = (res, user) => {
  if (
    user.OAuthTokens &&
    user.OAuthTokens.access_token &&
    user.OAuthTokens.refresh_token
  ) {
    res.header('APP-AT', user.OAuthTokens.access_token);
    res.header('APP-RT', user.OAuthTokens.refresh_token);
  }
};


// Get user data from Sherpa
router.get('/me', (req, res, next) => {
  const accessToken = req.get('APP-AT');
  const refreshToken = req.get('APP-RT');

  if (!accessToken || !refreshToken) {
    // Tokens are not set, return empty user object (logout)
    // librato.increment(req, 'missing-tokens');
    res.json({ user: {} });
  }
  else {
    // Attempt to load user data from sherpa using tokens

    // Initiate user
    const user = User();
    user.setTokens({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Load sherpa data
    user.loadSherpaData()
      .then(() => {
        // Set access and refresh token as header values
        setTokenHeaders(res, user);

        // Return user data
        if (user.id) {
          // librato.increment(req, 'ok');
          res.json({ user: user.getAPIRepresentation() });
        }
        else {
          // librato.increment(req, 'invalid-tokens');
          res.json({ user: {} });
        }
      })
      .catch((err) => {
        const error = err.message || 'error';
        // librato.increment(req, 'error');
        res.json({ error });
      });
  }
});

export default router;

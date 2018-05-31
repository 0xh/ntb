import { createSelector } from 'reselect';


export const getIsFetching = (state) => state['core/user'].fetching;


export const getFetchError = (state) => state['core/user'].fetchError;


export const getFetchTimestamp = (state) => state['core/user'].fetchTimestamp;


export const getData = (state) => state['core/user'].persisted.data;


export const getOAuthTokens = (state) =>
  state['core/user'].persisted.OAuthTokens;


export const getIsAuthenticated = createSelector(
  getData,
  (user) => !!(user && user.id)
);


export const getOAuthTokenHeaders = createSelector(
  getOAuthTokens,
  (tokens) => (
    !tokens || !tokens.access_token
      ? {}
      : {
        'APP-AT': tokens.access_token,
        'APP-RT': tokens.refresh_token,
      }
  )
);

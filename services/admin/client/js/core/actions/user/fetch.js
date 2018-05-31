import api from 'core/api';
import { getIsFetching, getOAuthTokenHeaders } from 'core/selectors/user';


export const FETCH = 'app/core/user/fetch/FETCH';
export const SUCCESS = 'app/core/user/fetch/SUCCESS';
export const ERROR = 'app/core/user/fetch/ERROR';


const fetch = () => (dispatch, getState) => {
  if (getIsFetching(getState())) {
    return Promise.resolve();
  }

  dispatch({ type: FETCH });

  const opts = {
    url: '/api/user/me',
    method: 'GET',
    headers: getOAuthTokenHeaders(getState()),
  };

  console.log(opts.headers);  // eslint-disable-line

  return api(opts).then(
    (response) => {
      dispatch({
        type: SUCCESS,
        payload: response,
      });
    },
    (error) => {
      dispatch({
        type: ERROR,
        message: error.message || 'unknown error',
      });
    }
  );
};


export default fetch;

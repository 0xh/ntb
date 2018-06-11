import api from 'core/api';
import { getIsFetching } from 'core/selectors/models';


export const FETCH = 'app/core/models/fetch/FETCH';
export const SUCCESS = 'app/core/models/fetch/SUCCESS';
export const ERROR = 'app/core/models/fetch/ERROR';


const fetch = () => (dispatch, getState) => {
  if (getIsFetching(getState())) {
    return Promise.resolve();
  }

  dispatch({ type: FETCH });

  const opts = {
    url: '/api/models',
    method: 'GET',
  };

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

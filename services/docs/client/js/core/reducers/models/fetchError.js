import * as fetchTypes from 'core/actions/models/fetch';


const fetchError = (state = false, action) => {
  switch (action.type) {
    case fetchTypes.FETCH:
    case fetchTypes.SUCCESS:
      return action.payload && action.payload.error
        ? action.payload.error
        : null;
    case fetchTypes.ERROR:
      return 'network error';
    default:
      return state;
  }
};


export default fetchError;

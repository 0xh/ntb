import * as fetchTypes from 'core/actions/models/fetch';


const fetching = (state = false, action) => {
  switch (action.type) {
    case fetchTypes.FETCH:
      return true;
    case fetchTypes.SUCCESS:
    case fetchTypes.ERROR:
      return false;
    default:
      return state;
  }
};


export default fetching;

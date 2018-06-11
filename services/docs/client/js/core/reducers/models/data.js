import * as fetchTypes from 'core/actions/models/fetch';


const data = (state = {}, action) => {
  switch (action.type) {
    case fetchTypes.SUCCESS:
      return action.payload.models
        ? action.payload.models
        : state;
    default:
      return state;
  }
};


export default data;

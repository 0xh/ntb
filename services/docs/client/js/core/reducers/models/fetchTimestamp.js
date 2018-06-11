import { FETCH } from 'core/actions/models/fetch';


const fetchTimestamp = (state = null, action) => {
  switch (action.type) {
    case FETCH:
      return new Date().toString();
    default:
      return state;
  }
};


export default fetchTimestamp;

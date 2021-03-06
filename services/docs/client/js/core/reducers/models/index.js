import { combineReducers } from 'redux';

import data from './data';
import fetching from './fetching';
import fetchError from './fetchError';
import fetchTimestamp from './fetchTimestamp';


const userReducer = combineReducers({
  data,
  fetching,
  fetchError,
  fetchTimestamp,
});


export default userReducer;

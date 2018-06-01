import { combineReducers } from 'redux';

import persisted from './persisted';
import fetching from './fetching';
import fetchError from './fetchError';
import fetchTimestamp from './fetchTimestamp';


const userReducer = combineReducers({
  persisted,
  fetching,
  fetchError,
  fetchTimestamp,
});


export default userReducer;

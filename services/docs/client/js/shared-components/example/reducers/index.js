import { combineReducers } from 'redux';

import persisted from './persisted';
import rehydrationDone from './rehydrationDone';
import lastActionTimestamp from './lastActionTimestamp';


const exampleReducers = combineReducers({
  rehydrationDone,
  persisted,
  lastActionTimestamp,
});


export default {
  'shared-components/example': exampleReducers,
};

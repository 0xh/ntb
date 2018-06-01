import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/es/storage';

import OAuthTokens from './OAuthTokens';
import data from './data';


const persistConfig = {
  key: 'core/user',
  version: '1',
  storage,
};


const rootReducer = combineReducers({
  OAuthTokens,
  data,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);


export default persistedReducer;

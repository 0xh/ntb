import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'react-router-redux';
import createHistory from 'history/createBrowserHistory';
import thunk from 'redux-thunk';

import configureReducers from './configureReducers';


const history = createHistory();
const middlewares = [thunk, routerMiddleware(history)];
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require
  const { createLogger } = require('redux-logger');
  middlewares.push(createLogger());
}

const createStoreWithMiddleware = compose(
  applyMiddleware(...middlewares)
)(createStore);


const configureStore = (reducerRegistry) => {
  const rootReducer = configureReducers(reducerRegistry.getReducers());
  const store = createStoreWithMiddleware(rootReducer);
  store.reducerRegistry = reducerRegistry;

  // Reconfigure the store's reducer when the reducer registry is changed - we
  // depend on this for loading reducers via code splitting and for hot
  // reloading reducer modules.
  reducerRegistry.setChangeListener((reducers) => {
    const newRootReducer = configureReducers(reducers);
    store.replaceReducer(newRootReducer);
  });

  return { store, history };
};


export default configureStore;

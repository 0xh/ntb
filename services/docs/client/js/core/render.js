import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import log from 'lib/log';

import configureStore from './configureStore';
import coreReducers from './reducers';
import ReducerRegistry from './ReducerRegistry';

import Root from './components/Root.jsx';


const container = document.getElementById('root');
const reducerRegistry = new ReducerRegistry(coreReducers);


const render = (Component, store, history) => {
  ReactDOM.render(
    <AppContainer warnings={false}>
      <Component
        store={store}
        history={history} />
    </AppContainer>,
    container
  );
};


const bootstrap = () => {
  const { store, history } = configureStore(reducerRegistry);
  render(Root, store, history);

  // Configure hot module replacement
  if (process.env.NODE_ENV !== 'production') {
    if (module.hot) {
      // HMR for Root component
      module.hot.accept(
        './components/Root.jsx',
        () => {
          // eslint-disable-next-line global-require
          const NewRoot = require('./components/Root.jsx').default;
          render(NewRoot, store, history);
        }
      );

      // HMR for core reducers
      module.hot.accept(
        './reducers/index.js',
        () => {
          log('Reducer HMR in render.js');
          // eslint-disable-next-line global-require
          const nextCoreReducers = require('./reducers').default;
          reducerRegistry.register(nextCoreReducers);
        }
      );
    }
  }
};


export default bootstrap;

import snakeCase from 'lodash/snakeCase';
import React, { Component } from 'react';
import { replace as routerReplace } from 'react-router-redux';
import { Route, withRouter } from 'react-router';
import { Layout } from 'antd';

import connect from 'lib/wrappedConnect';
import fetchModels from 'core/actions/models/fetch';
import { getPath, getQueryParams } from 'core/selectors/router';
import {
  getIsFetching as getIsFetchingModels,
  getEntryModelNames,
} from 'core/selectors/models';

import About from 'modules/About';
import Concepts from 'modules/Concepts';
import Utno from 'modules/Utno';
import Model from 'modules/Model';
import CoreLayout from './layout/CoreLayout.jsx';
import Loading from './layout/Loading.jsx';


const { Content } = Layout;


class App extends Component {
  componentDidMount() {
    const { actions } = this.props;
    actions.fetchModels();
  }

  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
      window.scrollTo(0, 0);
    }
  }

  render() {
    const {
      isFetchingModels,
      modelNames,
    } = this.props;

    if (isFetchingModels) {
      return (
        <CoreLayout>
          <Content style={{ minHeight: '200px', width: '100%' }}>
            <Loading text="One moment..." />
          </Content>
        </CoreLayout>
      );
    }

    return (
      <CoreLayout>
        <div>
          <Route exact path="/" component={About}/>
          <Route path="/concepts" component={Concepts}/>
          <Route path="/ut-no" component={Utno}/>

          {modelNames.map((modelName) => (
            <Route
              key={modelName}
              exact
              path={`/document/${snakeCase(modelName)}`}
              component={Model}
            />
          ))}
        </div>
      </CoreLayout>
    );
  }
}


const mapStateToProps = (state) => ({
  isFetchingModels: getIsFetchingModels(state),
  path: getPath(state),
  queryParams: getQueryParams(state),
  modelNames: getEntryModelNames(state, true),
});


const ConnectedComponent = withRouter(connect(
  mapStateToProps,
  { routerReplace, fetchModels }
)(App));


export default ConnectedComponent;

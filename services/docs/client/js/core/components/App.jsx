import React, { Component } from 'react';
import universal from 'react-universal-component';
import { replace as routerReplace } from 'react-router-redux';

import universalOptions from 'core/universalOptions';
import connect from 'lib/wrappedConnect';
import fetchUser from 'core/actions/user/fetch';
import setOAuthTokens from 'core/actions/user/setOAuthTokens';
import { getPath, getQueryParams } from 'core/selectors/router';
import {
  getIsFetching as getIsFetchingUser,
  getIsAuthenticated,
} from 'core/selectors/user';

import { Route } from 'react-router';
import { Link } from 'react-router-dom';
import { Layout } from 'antd';

import Dashboard from 'modules/dashboard';
import Users from 'modules/users';
import CoreLayout from './layout/CoreLayout.jsx';
import Loading from './layout/Loading.jsx';


const { Content } = Layout;


const Example = universal(
  () => import('shared-components/example'),
  {
    ...universalOptions,
    resolve: (props) => require.resolveWeak('shared-components/example'),
  }
);


class App extends Component {
  componentDidMount() {
    const { actions, path, queryParams } = this.props;

    // Set OAuthTokens defined from server
    const { OAuthTokens } = (window.sherpa || {});
    if (OAuthTokens) {
      actions.setOAuthTokens(OAuthTokens);
    }

    // If on an OAuth path (/o/verify/) redirect to `next` or dashboard
    if (path.startsWith('/o/')) {
      const nextPath = `/${queryParams.next || ''}`;
      actions.routerReplace(nextPath);
    }
    else {
      actions.fetchUser();
    }
  }

  render() {
    const {
      isFetchingUser,
    } = this.props;

    if (isFetchingUser) {
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
          <Link to="/">Hjem</Link>{' '}
          <Link to="/users">Brukere</Link>{' '}
          <Link to="/example">Example</Link>{' '}
        </div>

        <div>
          <Route exact path="/" component={Dashboard}/>
          <Route path="/users" component={Users}/>
          <Route path="/example" component={Example}/>
        </div>
      </CoreLayout>
    );
  }
}


const mapStateToProps = (state) => ({
  isFetchingUser: getIsFetchingUser(state),
  isAuthenticated: getIsAuthenticated(state),
  path: getPath(state),
  queryParams: getQueryParams(state),
});


const ConnectedComponent = connect(
  mapStateToProps,
  { setOAuthTokens, routerReplace, fetchUser }
)(App);


export default ConnectedComponent;

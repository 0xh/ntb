import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Layout, Button } from 'antd';


const { Content } = Layout;


class Root extends Component {
  render() {
    return (
      <Layout>
        <Content>
          <h1>Please log in</h1>
          <p>The secret buttons will appear afterwards!</p>
          <p>
            <Button
              type="primary"
              href="/o/forward">
              Go forwards to the magic user portal
            </Button>
          </p>
        </Content>
      </Layout>
    );
  }
}


const mapStateToProps = (state) => ({});


const connectedComponent = connect(
  mapStateToProps,
  {},
  (stateProps, dispatchProps, ownProps) =>
    Object.assign({}, ownProps, stateProps, { actions: dispatchProps })
)(Root);

export default connectedComponent;

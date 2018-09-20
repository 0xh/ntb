import React, { Component } from 'react';
import { connect } from 'react-redux';
import ModelList from './ModelList.jsx';


class Root extends Component {
  render() {
    return (
      <div>
        Main
        <ModelList />
      </div>
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

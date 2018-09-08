import React, { Component } from 'react';

import connect from 'lib/wrappedConnect';


class Root extends Component {
  render() {
    return (
      <div>
        About Nasjonal Turbase
        {/* <ModelList /> */}
      </div>
    );
  }
}


const mapStateToProps = (state) => ({});


const ConnectedComponent = connect(
  mapStateToProps
)(Root);

export default ConnectedComponent;

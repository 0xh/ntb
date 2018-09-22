import React, { Component } from 'react';

import connect from 'lib/wrappedConnect';


class Root extends Component {
  render() {
    return (
      <div>
        About NTB
      </div>
    );
  }
}


const ConnectedComponent = connect()(Root);
export default ConnectedComponent;

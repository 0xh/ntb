import React, { Component } from 'react';

import connect from 'lib/wrappedConnect';
import {
  getModelConfigByReferrers,
} from 'core/selectors/models';

import Fields from './Fields.jsx';


class Details extends Component {
  render() {
    const { config, single, modelNameKey } = this.props;

    return (
      <div>
        <Fields
          modelNameKey={modelNameKey}
          single={single}
          config={config}
        />
        <pre>
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => ({
  config: getModelConfigByReferrers(
    state,
    ownProps.modelNameKey,
    ownProps.referrers
  ),
});

const ConnectedComponent = connect(mapStateToProps)(Details);
export default ConnectedComponent;

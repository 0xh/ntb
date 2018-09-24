import camelCase from 'lodash/camelCase';
import upperFirst from 'lodash/upperFirst';
import React, { Component } from 'react';
import { autobind } from 'core-decorators';

import connect from 'lib/wrappedConnect';
import { getPath } from 'core/selectors/router';

import ListOrSingleSelector from './ListOrSingleSelector.jsx';
import Details from './Details.jsx';


class Root extends Component {
  constructor(props) {
    super(props);
    this.state = {
      referrers: '*list',
      single: false,
    };
  }

  @autobind
  setReferres(event) {
    this.setState({
      referrers: event.target.value,
      single: event.target.value === '*single',
    });
  }

  render() {
    const { path } = this.props;
    const { referrers, single } = this.state;
    const modelName = path.slice(10);
    const modelNameKey = upperFirst(camelCase(modelName));

    return (
      <div>
        <h1>{modelNameKey}</h1>

        <ListOrSingleSelector
          modelName={modelName}
          modelNameKey={modelNameKey}
          referrers={referrers}
          setReferres={this.setReferres}
        />

        <p>&nbsp;</p>
        <Details
          modelName={modelName}
          modelNameKey={modelNameKey}
          referrers={[referrers]}
          single={single}
          level={0}
        />
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => ({
  path: getPath(state),
});

const ConnectedComponent = connect(mapStateToProps)(Root);
export default ConnectedComponent;

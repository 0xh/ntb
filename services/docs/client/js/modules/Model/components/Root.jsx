import camelCase from 'lodash/camelCase';
import upperFirst from 'lodash/upperFirst';
import React, { Component } from 'react';
import { Radio } from 'antd';
import { autobind } from 'core-decorators';

import connect from 'lib/wrappedConnect';
import { getPath } from 'core/selectors/router';

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
    const modelName = path.slice(1);
    const modelNameKey = upperFirst(camelCase(modelName));

    return (
      <div>
        <h1>{modelNameKey}</h1>

        <Radio.Group value={referrers} onChange={this.setReferres}>
          <Radio.Button value="*list">
            <strong>/{modelName}/</strong>
            &nbsp;
            <small><em>list of documents</em></small>
          </Radio.Button>
          <Radio.Button value="*single">
            <strong>/{modelName}/&lt;id&gt;</strong>
            &nbsp;
            <small><em>single document</em></small>
          </Radio.Button>
        </Radio.Group>

        <Details
          modelName={modelName}
          modelNameKey={modelNameKey}
          referrers={[referrers]}
          single={single}
        />
      </div>
    );
  }
}


const mapStateToProps = (state) => ({
  path: getPath(state),
});

const ConnectedComponent = connect(mapStateToProps)(Root);
export default ConnectedComponent;

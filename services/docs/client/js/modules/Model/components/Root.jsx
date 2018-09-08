import React, { Component } from 'react';
import { autobind } from 'core-decorators';

import connect from 'lib/wrappedConnect';
import {
  getModels,
  getModelRelations,
  getModelSchema,
} from 'core/selectors/models';

import Nl2p from 'shared-components/Nl2p';

import ListSingleReferrerSelector from './ListSingleReferrerSelector.jsx';
import ModelFieldList from './ModelFieldList.jsx';


class Root extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isStandAlone: !props.referrers,
      referrers: props.referrers || ['*list'],
      single: !!props.single,
    };
  }

  @autobind
  onChangeStandAloneReferrer(newReferrer) {
    const single = newReferrer === '*single';
    this.setState({
      referrers: [newReferrer],
      single,
    });
  }

  render() {
    const { isStandAlone, referrers, single } = this.state;
    const {
      model,
      modelName,
      schema,
    } = this.props;

    return (
      <div>
        <h1>{modelName}</h1>
        <div>
          <Nl2p text={model.modelDescription} />
        </div>

        {isStandAlone && (
          <div>
            <ListSingleReferrerSelector
              referrer={referrers[0]}
              onChange={this.onChangeStandAloneReferrer} />
          </div>
        )}

        <ModelFieldList
          modelName={modelName}
          referrers={referrers}
          schema={schema}
          single={single}
        />

        <pre>{JSON.stringify(this.props, false, 2)}</pre>
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => ({
  model: getModels(state)[ownProps.modelName],
  relations: getModelRelations(state, ownProps.modelName),
  schema: getModelSchema(state, ownProps.modelName),
});


const ConnectedComponent = connect(
  mapStateToProps
)(Root);

export default ConnectedComponent;

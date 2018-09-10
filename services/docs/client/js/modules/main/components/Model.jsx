import React, { Component } from 'react';

import connect from 'lib/wrappedConnect';
import {
  getModelRelations,
  getModelSchema,
  getModelConfigByReferrer,
} from 'core/selectors/models';

import ModelDescription from './ModelDescription.jsx';
import ModelFieldsList from './ModelFieldsList.jsx';
import ModelRelationList from './ModelRelationList.jsx';


class Model extends Component {
  render() {
    const {
      config,
      name,
      schema,
      relations,
      belongsToOneRelation,
      single,
      referrer,
    } = this.props;

    return (
      <div>
        <ModelDescription
          config={config}
          name={name}
          referrer={referrer}
          belongsToOneRelation={belongsToOneRelation}
        />

        <ModelFieldsList
          single={single}
          config={config}
          schema={schema}
        />

        <ModelRelationList
          referrerModel={name}
          relations={relations}
          referrerIsSingle={single}
        />
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => ({
  relations: getModelRelations(state, ownProps.name),
  schema: getModelSchema(state, ownProps.name),
  config: getModelConfigByReferrer(
    state,
    ownProps.name,
    ownProps.referrer,
    ownProps.single,
  ),
});


const ConnectedComponent = connect(
  mapStateToProps
)(Model);


export default ConnectedComponent;

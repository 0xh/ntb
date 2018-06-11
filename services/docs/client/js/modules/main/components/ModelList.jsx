import snakeCase from 'lodash/snakeCase';
import React, { Component } from 'react';

import { Layout, List, Collapse } from 'antd';

import connect from 'lib/wrappedConnect';
import { getModelNames, getModels } from 'core/selectors/models';

import Model from './Model.jsx';


const { Panel } = Collapse;


class ModelList extends Component {
  render() {
    const { modelNames, models } = this.props;

    return (
      <Layout>
        {JSON.stringify(this.state)}
        <List
          itemLayout="vertical">
          {modelNames.map((modelName) => (
            <List.Item key={modelName}>
              <h2>{modelName}</h2>

              <Collapse bordered={false}>
                <Panel
                  header={`/${snakeCase(modelName)}`}>
                    <Model
                      name={modelName}
                      referrer={['*list']} />
                </Panel>
                <Panel
                  header={
                      `/${snakeCase(modelName)}/` +
                      `[${snakeCase(models[modelName].idColumn)}]`
                    }>
                    <Model
                      name={modelName}
                      referrer={['*single']}
                      single={true} />
                </Panel>
              </Collapse>
            </List.Item>
          ))}
        </List>
      </Layout>
    );
  }
}


const mapStateToProps = (state) => ({
  modelNames: getModelNames(state),
  models: getModels(state),
});


const ConnectedComponent = connect(
  mapStateToProps
)(ModelList);


export default ConnectedComponent;

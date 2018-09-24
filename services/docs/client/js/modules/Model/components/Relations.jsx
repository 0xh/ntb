import React, { Component } from 'react';
import { Divider, Row, Col, Alert } from 'antd';

import connect from 'lib/wrappedConnect';
import {
  getModelRelations,
} from 'core/selectors/models';

import RelationRow from './RelationRow.jsx';


class Relations extends Component {
  render() {
    const {
      relations,
      config,
      level,
      modelName,
      modelNameKey,
      single,
      titlePrefix,
    } = this.props;
    const { defaultRelations } = config;

    const isMaxLevel = level >= 2;

    // No relations
    if (!relations || !(Object.keys(relations).length)) {
      return null;
    }

    return (
      <div className="model-details-section">
        <Divider />
        <h2>Relations</h2>

       {isMaxLevel && (
         <Alert
          message="You have reached max depth"
          description={
            <React.Fragment>
              <p>
                You have reached max depth that you are allowed to include with
                your current credentials. You can request an increase of this
                limit in your apps configuration screen.
              </p>
              <p>
                <a href="/concepts/relation-depth">Read more about it here.</a>
              </p>
            </React.Fragment>
          }
          type="warning"
          showIcon
        />
       )}

        {!isMaxLevel && (
          <Row>
            <Col span={16}>&nbsp;</Col>
            <Col span={4} style={{ textAlign: 'center' }}>
              <strong>*default</strong>
            </Col>
          </Row>
        )}

        {isMaxLevel && <br />}

        {Object.keys(relations).map((relationName) => (
          <RelationRow
            key={relationName}
            defaultRelation={(defaultRelations || []).includes(relationName)}
            relationName={relationName}
            relation={relations[relationName]}
            level={level}
            modelName={modelName}
            modelNameKey={modelNameKey}
            single={single}
            titlePrefix={titlePrefix}
            isMaxLevel={isMaxLevel}
          />
        ))}
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => ({
  relations: getModelRelations(state, ownProps.modelNameKey),
});

const ConnectedComponent = connect(mapStateToProps)(Relations);
export default ConnectedComponent;

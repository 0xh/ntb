import React, { Component } from 'react';
import { Row, Col } from 'antd';

import connect from 'lib/wrappedConnect';
import {
  getModelSchema,
} from 'core/selectors/models';

import FieldRow from './FieldRow.jsx';


class Fields extends Component {
  render() {
    const { schema, config } = this.props;

    return (
      <div
        style={{
          marginTop: '32px',
          maxWidth: '700px',
          minWidth: '600px',
          overflow: 'auto',
        }}
      >
        <h3>Available fields</h3>

        <Row>
          <Col span={7}><strong>Field name</strong></Col>
          <Col span={5}><strong>Field type</strong></Col>
          <Col span={4} style={{ textAlign: 'center' }}>
            <strong>Read only</strong>
          </Col>
          <Col span={4} style={{ textAlign: 'center' }}>
            <strong>*default</strong>
          </Col>
          <Col span={4} style={{ textAlign: 'center' }}>
            <strong>*full</strong>
          </Col>
        </Row>
        {Object.keys(schema.properties).map((key) => (
          <FieldRow
            key={key}
            fieldKey={key}
            schema={schema}
            config={config}
          />
        ))}
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => ({
  schema: getModelSchema(
    state,
    ownProps.modelNameKey,
  ),
});


const ConnectedComponent = connect(mapStateToProps)(Fields);
export default ConnectedComponent;

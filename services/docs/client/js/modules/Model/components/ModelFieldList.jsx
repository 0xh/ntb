import React, { Component } from 'react';
import { Row, Col } from 'antd';

import connect from 'lib/wrappedConnect';
import { getModelConfigByReferrer } from 'core/selectors/models';

import ModelFieldRow from './ModelFieldRow.jsx';


class ModelFieldList extends Component {
  render() {
    const { schema, config, single } = this.props;
    const fields = Object.keys(schema.properties);

    return (
      <div style={{ minWidth: '650px', maxWidth: '1000px' }}>
        <Row>
          <Col span={1} className="field-list__header">&nbsp;</Col>
          <Col span={8} className="field-list__header">Field name</Col>
          <Col span={5} className="field-list__header">Type</Col>
          <Col span={2} className="field-list__header">
            <span className="field-list__header-label-rotated">Filter</span>
          </Col>
          <Col span={2} className="field-list__header">
            <span className="field-list__header-label-rotated">Returable</span>
          </Col>
          <Col span={2} className="field-list__header">
            <span className="field-list__header-label-rotated">Read only</span>
          </Col>
          <Col span={2} className="field-list__header">
            <span className="field-list__header-label-rotated">*default</span>
          </Col>
          <Col span={2} className="field-list__header">
            <span className="field-list__header-label-rotated">*full</span>
          </Col>
        </Row>
        {fields.map((fieldName, idx) => (
          <ModelFieldRow
            even={idx % 2}
            key={fieldName}
            fieldName={fieldName}
            config={config}
            schema={schema}
            single={single}
          />
        ))}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  config: getModelConfigByReferrer(
    state,
    ownProps.modelName,
    ownProps.referrers,
    ownProps.single,
  ),
});


const ConnectedComponent = connect(
  mapStateToProps
)(ModelFieldList);

export default ConnectedComponent;

import React, { Component } from 'react';
import { Row, Col } from 'antd';

import connect from 'lib/wrappedConnect';


const stringFilters = (content, filterTypes, fieldName) => {
  if (!filterTypes || filterTypes.includes('=')) {
    content.push(
      <Row key="string-exact" align="bottom" className="field-filter-info">
        <Col span={8}>
          Exact match
        </Col>
        <Col span={16}>
          <pre>?{fieldName}=&lt;some string value&gt;</pre>
        </Col>
      </Row>
    );
  }

  if (!filterTypes || filterTypes.includes('null')) {
    content.push(
      <Row key="string-null" align="bottom" className="field-filter-info">
        <Col span={8}>
          Is null (empty)
        </Col>
        <Col span={16}>
          <pre>?{fieldName}=</pre>
        </Col>
      </Row>
    );
  }

  if (!filterTypes || filterTypes.includes('notnull')) {
    content.push(
      <Row key="string-null" align="bottom" className="field-filter-info">
        <Col span={8}>
          Does not contain a value
        </Col>
        <Col span={16}>
          <pre>?{fieldName}=!</pre>
        </Col>
      </Row>
    );
  }

  if (!filterTypes || filterTypes.includes('$in')) {
    content.push(
      <Row key="string-null" align="bottom" className="field-filter-info">
        <Col span={8}>
          Equals one of the values
        </Col>
        <Col span={16}>
          <pre>?{fieldName}=$in:{'"<value1>","<value2>","<value3>"'}</pre>
        </Col>
      </Row>
    );
  }

  if (!filterTypes || filterTypes.includes('$nin')) {
    content.push(
      <Row key="string-null" align="bottom" className="field-filter-info">
        <Col span={8}>
          Not equal one of the values
        </Col>
        <Col span={16}>
          <pre>?{fieldName}=$nin:{'"<value1>","<value2>","<value3>"'}</pre>
        </Col>
      </Row>
    );
  }

  return content;
};


class ModelFieldFilterOptions extends Component {
  render() {
    const { schema, fieldName, filterTypes } = this.props;
    let fieldSchema;

    if (!Array.isArray(fieldName)) {
      fieldSchema = schema.properties[fieldName];
    }
    else {
      fieldSchema = schema.properties[fieldName[0]];
      fieldName.slice(1).forEach((subFieldName) => {
        if (fieldSchema.type === 'object') {
          fieldSchema = fieldSchema.properties[subFieldName];
        }
      });
    }

    const formatKey = fieldSchema.format
      ? `.${fieldSchema.format}`
      : '';
    const typeKey = `${fieldSchema.type}${formatKey}`;

    const content = [
      <h4 key={0}>Valid filter options</h4>,
    ];

    switch (typeKey) {
      case 'string':
        return stringFilters(content, filterTypes, fieldName);
      default:
        return null;
    }
  }
}


const mapStateToProps = (state, ownProps) => ({});


const ConnectedComponent = connect(
  mapStateToProps
)(ModelFieldFilterOptions);

export default ConnectedComponent;

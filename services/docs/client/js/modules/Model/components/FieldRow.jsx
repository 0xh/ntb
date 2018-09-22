import snakeCase from 'lodash/snakeCase';
import React, { Component } from 'react';
import { autobind } from 'core-decorators';
import { Row, Col, Menu, Dropdown, Icon } from 'antd';

import connect from 'lib/wrappedConnect';


class FieldRow extends Component {
  @autobind
  getDefaultFields() {
    const { config } = this.props;
    const { defaultFields, fullFields } = config;
    let fields = [];

    defaultFields.forEach((field) => {
      if (field === '*full') {
        fields = [].concat(fields, fullFields);
      }
      else if (field.startsWith('-')) {
        fields = fields.filter((f) => f !== field);
      }
      else {
        fields.push(field);
      }
    });

    return Array.from(new Set(fields));
  }

  enumDropdown = (values) => (
    <Menu>
      {values.map((value, idx) => (
        <Menu.Item key={idx}>{value}</Menu.Item>
      ))}
    </Menu>
  );

  type = (options) => {
    const typeKeys = [options.type, options.format];
    if (options.enum) {
      typeKeys.push('enum');
    }
    else if (options.geojsonType) {
      typeKeys.push('geojson');
    }
    else if (
      options.type === 'array'
      && options.items
      && typeof options.items === 'object'
      && options.items.constructor === Object
      && options.items.type
    ) {
      typeKeys.push(options.items.type);
    }
    else if (this.shouldRenderSubfields(options)) {
      typeKeys.push('subkeys');
    }

    const typeKey = typeKeys.filter((k) => k).join('.');

    switch (typeKey) {
      case 'string.uuid':
        return <span>uuid</span>;
      case 'string.date':
        return <span>datetime</span>;
      case 'string.email':
        return <span>e-mail</span>;
      case 'string.enum':
        return (
          <Dropdown overlay={this.enumDropdown(options.enum)}>
            <span>text - ENUM <Icon type="down" /></span>
          </Dropdown>
        );
      case 'string':
        return <span>text</span>;
      case 'number':
        return <span>number</span>;
      case 'array.string':
        return <span>array of texts</span>;
      case 'array.object':
        return <span>array of objects</span>;
      case 'array':
          console.log('ARRAY', options);  // eslint-disable-line
        return <span>array</span>;
      case 'boolean':
        return <span>boolean</span>;
      case 'date':
        return <span>date</span>;
      case 'object.geojson':
        return <span>GeoJSON - {options.geojsonType}</span>;
      case 'object.subkeys':
        return <span>object</span>;
      default:
        console.log('UNKNOWN', options);  // eslint-disable-line
        return <em title={typeKey}>UNKNOWN</em>;
    }
  };

  readOnly = (options) => (
    !options.readOnly
      ? <span>&nbsp;</span>
      : <span>&#10004;</span>
  )

  inDefault = (fieldKey) => {
    const defaultFields = this.getDefaultFields();
    return defaultFields.includes(fieldKey)
      ? <span>&#10004;</span>
      : <span>&nbsp;</span>;
  }


  @autobind
  inFull(fieldKey) {
    const { config } = this.props;
    const { fullFields } = config;
    return fullFields.includes(fieldKey)
      ? <span>&#10004;</span>
      : <span>&nbsp;</span>;
  }

  shouldRenderSubfields = (options) => (
    (
      options.type === 'object'
      && options.properties
      && !options.geojsonType
    )
    || (
      options.type === 'array'
      && options.items
      && options.items.type === 'object'
      && options.items.properties
      && !options.items.geojsonType
    )
  );

  renderSubfields = (options) => {
    if (!this.shouldRenderSubfields(options)) return null;
    const properties = options.type === 'object'
      ? options.properties
      : options.items.properties;

    return Object.keys(properties).map((subFieldKey) => (
      <Row
        key={subFieldKey}
        style={{
          backgroundColor: '#f0f0f0',
          marginBottom: '1px',
          marginLeft: '15px',
          paddingLeft: '6px',
        }}
      >
        <Col span={7}>| &nbsp;&nbsp;{snakeCase(subFieldKey)}</Col>
        <Col span={5}>{this.type(properties[subFieldKey])}</Col>
      </Row>
    ));
  }

  render() {
    const { schema, fieldKey } = this.props;
    const options = schema.properties[fieldKey];

    return (
      <React.Fragment>
        <Row
          style={{
            backgroundColor: '#f5f5f5',
            marginBottom: '1px',
            paddingLeft: '6px',
          }}
        >
          <Col span={7}><strong>{snakeCase(fieldKey)}</strong></Col>
          <Col span={5}>{this.type(options)}</Col>
          <Col span={4} style={{ textAlign: 'center' }}>
            {this.readOnly(options)}
          </Col>
          <Col span={4} style={{ textAlign: 'center' }}>
            {this.inDefault(fieldKey)}
          </Col>
          <Col span={4} style={{ textAlign: 'center' }}>
            {this.inFull(fieldKey)}
          </Col>
        </Row>
        {this.renderSubfields(options)}
      </React.Fragment>
    );
  }
}


const ConnectedComponent = connect()(FieldRow);
export default ConnectedComponent;

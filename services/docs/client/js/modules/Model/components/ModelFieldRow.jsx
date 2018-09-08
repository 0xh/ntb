import React, { Component } from 'react';
import { autobind } from 'core-decorators';
import { Row, Col } from 'antd';

import connect from 'lib/wrappedConnect';

import ModelFieldRowColumns from './ModelFieldRowColumns.jsx';
import ModelFieldFilterOptions from './ModelFieldFilterOptions.jsx';


class ModelFieldRow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showInformation: false,
    };
  }

  @autobind
  onToggleInformation(single, isValidFilter) {
    if (!single && isValidFilter) {
      this.setState({
        showInformation: !this.state.showInformation,
      });
    }
  }

  getDefaultFields = (config) => {
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

  render() {
    const {
      fieldName,
      schema,
      config,
      single,
      even,
    } = this.props;
    const { validFilters, fullFields } = config;
    const defaultFields = this.getDefaultFields(config);
    const { showInformation } = this.state;
    const isValidFilter = Object.keys(validFilters).includes(fieldName);
    let className = `field-row${even ? ' field-row--even' : ''}`;

    if (!single && isValidFilter) {
      className += ' field-row--hover';
    }

    return (
      <React.Fragment>
        <Row
          className={className}
          onClick={() => this.onToggleInformation(single, isValidFilter)}
        >
          <ModelFieldRowColumns
            fieldNames={fieldName}
            schema={schema}
            validFilters={validFilters}
            isValidFilter={isValidFilter}
            defaultFields={defaultFields}
            fullFields={fullFields}
            single={single}
            isSubList={false}
            toggled={showInformation}
          />

          {
            schema.properties[fieldName].type === 'object' &&
            schema.properties[fieldName].properties &&
            Object.keys(schema.properties[fieldName].properties)
              .map((subFieldName, idx) => (
                <ModelFieldRowColumns
                  key={idx}
                  fieldNames={[fieldName, subFieldName]}
                  schema={schema}
                  validFilters={null}
                  defaultFields={null}
                  fullFields={null}
                  single={true}
                  isSubList={true}
                />
              ))
          }
        </Row>
        {showInformation && isValidFilter && (
          <Row className={`${className} field-row__subrow`}>
            <Col span={23} push={1}>
              <ModelFieldFilterOptions
                schema={schema}
                fielterTypes={validFilters[fieldName] || {}}
                fieldName={fieldName} />
              <pre>
                {JSON.stringify((validFilters[fieldName] || {}), false, 2)}
              </pre>
            </Col>
          </Row>
        )}
      </React.Fragment>
    );
  }
}


const mapStateToProps = (state) => ({});


const ConnectedComponent = connect(
  mapStateToProps
)(ModelFieldRow);

export default ConnectedComponent;

import React, { Component } from 'react';
import { Col, Icon } from 'antd';
import snakeCase from 'lodash/snakeCase';

import connect from 'lib/wrappedConnect';

import ModelFieldType from './ModelFieldType.jsx';
import ModelFieldFilter from './ModelFieldFilter.jsx';
import ModelFieldReturnable from './ModelFieldReturnable.jsx';
import ModelFieldReadOnly from './ModelFieldReadOnly.jsx';
import ModelFieldDefault from './ModelFieldDefault.jsx';
import ModelFieldFull from './ModelFieldFull.jsx';


class ModelFieldRowColumns extends Component {
  render() {
    const {
      fieldNames,
      schema,
      validFilters,
      defaultFields,
      fullFields,
      single,
      isSubList,
      toggled,
      isValidFilter,
    } = this.props;
    const fieldName = Array.isArray(fieldNames)
      ? fieldNames.slice(-1)[0]
      : fieldNames;

    return (
      <React.Fragment>
        <Col span={1}>
          {!isSubList && isValidFilter && !single && (
            <Icon
              type={toggled ? 'down' : 'right'}
              theme="outlined" />
          )}
        </Col>

        <Col span={8}>
          <span
            className={`field-name ${isSubList ? 'field-name--subname' : ''}`}
          >
            {snakeCase(fieldName)}
          </span>
        </Col>
        <Col span={5}>
          <ModelFieldType
            fieldName={fieldNames}
            schema={schema} />
        </Col>

        {!isSubList && (
          <React.Fragment>
            <Col span={2}>
              <ModelFieldFilter
                fieldName={fieldName}
                single={single}
                validFilters={validFilters} />
            </Col>
            <Col span={2}>
              <ModelFieldReturnable
                fieldName={fieldName}
                schema={schema} />
            </Col>
            <Col span={2}>
              <ModelFieldReadOnly
                fieldName={fieldName}
                schema={schema} />
            </Col>
            <Col span={2}>
              <ModelFieldDefault
                fieldName={fieldName}
                defaultFields={defaultFields} />
            </Col>
            <Col span={2}>
              <ModelFieldFull
                fieldName={fieldName}
                fullFields={fullFields} />
            </Col>
          </React.Fragment>
        )}

        {isSubList && (
          <Col span={10}>&nbsp;</Col>
        )}
      </React.Fragment>
    );
  }
}


const mapStateToProps = (state) => ({});


const ConnectedComponent = connect(
  mapStateToProps
)(ModelFieldRowColumns);

export default ConnectedComponent;

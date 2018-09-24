import snakeCase from 'lodash/snakeCase';
import React, { Component } from 'react';
import { Row, Col, Icon } from 'antd';
import { autobind } from 'core-decorators';

import connect from 'lib/wrappedConnect';


class FilterRow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    };
  }

  @autobind
  onToggle(event) {
    this.setState({ open: !this.state.open });
    event.preventDefault();
  }

  type = (options) => {
    switch (options.type) {
      case 'uuid':
        return 'uuid';
      case 'text':
        return 'text';
      case 'date':
        return 'date';
      case 'boolean':
        return 'boolean';
      case 'number':
        return 'number';
      case 'relationExistance':
        return 'relation exists';
      default:
        return 'UNKNOWN';
    }
  }

  relationExistanceFilterDetails = () => {
    const details = [];

    details.push({
      prefix: null,
      description: 'Related document exist',
      value: '',
    });
    details.push({
      prefix: null,
      description: 'Related document does not exist',
      value: '!',
    });

    return details;
  }

  uuidFilterDetails = (filter) => {
    const details = [];
    const { filterTypes } = filter;


    if (!filterTypes || filterTypes.includes('notnull')) {
      details.push({
        prefix: null,
        description: 'Not Null / Has a value',
        value: null,
      });
    }
    if (!filterTypes || filterTypes.includes('null')) {
      details.push({
        prefix: null,
        description: 'Null / Empty value',
        value: '!',
      });
    }
    if (!filterTypes || filterTypes.includes('=')) {
      details.push({
        prefix: null,
        description: 'Equal',
      });
    }
    if (!filterTypes || filterTypes.includes('$in')) {
      details.push({
        prefix: '$in:',
        description: 'Equal to one of the values',
        value: '"{uuid1}","{uuid2}"',
      });
    }
    if (!filterTypes || filterTypes.includes('$nin')) {
      details.push({
        prefix: '$nin:',
        description: 'Not equal to one of the values',
        value: '"{uuid1}","{uuid2}"',
      });
    }

    return details
      .map((d) => {
        if (d.value === undefined) {
          d.value = '{uuid}';
        }
        return d;
      });
  }

  dateFilterDetails = (filter) => {
    const details = [];
    const { filterTypes } = filter;

    if (!filterTypes || filterTypes.includes('notnull')) {
      details.push({
        prefix: null,
        description: 'Not Null / Has a value',
        value: null,
      });
    }
    if (!filterTypes || filterTypes.includes('null')) {
      details.push({
        prefix: null,
        description: 'Null / Empty value',
        value: '!',
      });
    }
    if (!filterTypes || filterTypes.includes('=')) {
      details.push({
        prefix: null,
        description: 'Equal',
      });
    }
    if (!filterTypes || filterTypes.includes('$after')) {
      details.push({
        prefix: '$after:',
        description: 'After date',
        value: '1970-01-01T10:00:00',
      });
    }
    if (!filterTypes || filterTypes.includes('$before')) {
      details.push({
        prefix: '$before:',
        description: 'Before date',
        value: '2020-01-01T10:00:00',
      });
    }
    if (!filterTypes || filterTypes.includes('$between')) {
      details.push({
        prefix: '$between:',
        description: 'Between dates (pipe separated)',
        value: '1970-01-01T10:00:00|2020-01-01T10:00:00',
      });
    }

    return details;
  }

  numberFilterDetails = (filter) => {
    const details = [];
    const { filterTypes } = filter;

    if (!filterTypes || filterTypes.includes('notnull')) {
      details.push({
        prefix: null,
        description: 'Not Null / Has a value',
        value: null,
      });
    }
    if (!filterTypes || filterTypes.includes('null')) {
      details.push({
        prefix: null,
        description: 'Null / Empty value',
        value: '!',
      });
    }
    if (!filterTypes || filterTypes.includes('=')) {
      details.push({
        prefix: null,
        description: 'Equal',
      });
    }
    if (!filterTypes || filterTypes.includes('$gt')) {
      details.push({
        prefix: '$gt:',
        description: 'Greater than',
      });
    }
    if (!filterTypes || filterTypes.includes('$gte')) {
      details.push({
        prefix: '$gte:',
        description: 'Greater than or equal',
      });
    }
    if (!filterTypes || filterTypes.includes('$lt')) {
      details.push({
        prefix: '$lt:',
        description: 'Less than',
      });
    }
    if (!filterTypes || filterTypes.includes('$lte')) {
      details.push({
        prefix: '$lte:',
        description: 'Less than or equal',
      });
    }

    return details
      .map((d) => {
        if (d.value === undefined) {
          d.value = '2';
        }
        return d;
      });
  }

  booleanFilterDetails = (filter) => {
    const details = [];

    details.push({
      prefix: 'true',
      description: 'True',
      value: null,
    });
    details.push({
      prefix: 'false',
      description: 'False or NULL',
      value: null,
    });

    return details;
  }

  textFilterDetails = (filter) => {
    const details = [];
    const { filterTypes } = filter;

    if (!filterTypes || filterTypes.includes('notnull')) {
      details.push({
        prefix: null,
        description: 'Not Null / Has a value',
        value: null,
      });
    }
    if (!filterTypes || filterTypes.includes('null')) {
      details.push({
        prefix: null,
        description: 'Null / Empty value',
        value: '!',
      });
    }
    details.push({
      prefix: null,
      description: 'Equal',
    });
    if (!filterTypes || filterTypes.includes('!')) {
      details.push({
        prefix: '!',
        description: 'Not equal',
      });
    }
    if (!filterTypes || filterTypes.includes('^')) {
      details.push({
        prefix: '^',
        description: 'Starts with',
      });
    }
    if (!filterTypes || filterTypes.includes('$')) {
      details.push({
        prefix: '$',
        description: 'Ends with',
      });
    }
    if (!filterTypes || filterTypes.includes('~')) {
      details.push({
        prefix: '~',
        description: 'Contains',
      });
    }
    if (!filterTypes || filterTypes.includes('$in')) {
      details.push({
        prefix: '$in:',
        description: 'Equal to one of the values',
        value: '"foo","bar"',
      });
    }
    if (!filterTypes || filterTypes.includes('$nin')) {
      details.push({
        prefix: '$nin:',
        description: 'Not equal to one of the values',
        value: '"foo","bar"',
      });
    }

    return details
      .map((d) => {
        if (d.value === undefined) {
          d.value = 'foo';
        }
        return d;
      });
  }

  renderFilterDetails = (filterKey, filter, filterName) => {
    let details = [];
    let description = '';
    switch (filter.type) {
      case 'text': {
        const sensitive = filter.caseInsensitive ? 'insensitive' : 'sensitive';
        description = <span>Uses <em>case {sensitive}</em> comparison.</span>;
        details = this.textFilterDetails(filter);
        break;
      }
      case 'uuid':
        details = this.uuidFilterDetails(filter);
        break;
      case 'number':
        details = this.numberFilterDetails(filter);
        break;
      case 'boolean':
        details = this.booleanFilterDetails(filter);
        break;
      case 'date':
        description = 'Supports ISO 8601 formatted dates.';
        details = this.dateFilterDetails(filter);
        break;
      case 'relationExistance':
        description = 'Filter whether related documents exist';
        details = this.relationExistanceFilterDetails();
        break;
      default:
        details = [];
        break;
    }

    return (
      <Row className="sub-row sub-row--top-bottom-padded">
        <Col span={24}>
          <p>{description}</p>
          <Row>
            <Col span={8}>&nbsp;</Col>
            <Col span={4}><em>Prefix</em></Col>
            <Col span={12}><em>Example</em></Col>
          </Row>
          {details.map((detail, idx) => (
            <Row key={idx} className="subtle-row">
              <Col span={8}>{detail.description}</Col>
              <Col span={4}>{detail.prefix}</Col>
              <Col span={12}>
                <pre className="no-margin">
                  ?{filterName}={detail.prefix || ''}{detail.value}
                </pre>
              </Col>
            </Row>
          ))}
        </Col>
      </Row>
    );
  }

  render() {
    const { filterKey, filter, prefix } = this.props;
    const { open } = this.state;
    const casedFilterKey = filterKey
      .split('.')
      .map((k) => snakeCase(k))
      .join('.');
    const filterName = `${prefix || ''}${casedFilterKey}`;

    return (
      <React.Fragment>
        <Row key={filterKey} className="main-row">
          <Col span={16}>
            <strong>
              {filterName}
            </strong>
          </Col>
          <Col span={4}>{this.type(filter)}</Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            <a href="#" onClick={this.onToggle}>
              {filter.filterTypes
                ? 'Limited filter'
                : 'Full filter'
              }
              &nbsp;
              <Icon type={open ? 'up' : 'down'} />
            </a>
          </Col>
        </Row>
        {open && this.renderFilterDetails(filterKey, filter, filterName)}
      </React.Fragment>
    );
  }
}

const ConnectedComponent = connect()(FilterRow);
export default ConnectedComponent;

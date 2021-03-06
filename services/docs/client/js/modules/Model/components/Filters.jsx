import snakeCase from 'lodash/snakeCase';
import React, { Component } from 'react';
import { Divider } from 'antd';

import connect from 'lib/wrappedConnect';
import {
  getRelationFilters,
} from 'core/selectors/models';

import FilterRow from './FilterRow.jsx';


class Filters extends Component {
  render() {
    const { modelNameKey, config, relationFilters } = this.props;
    const { filters } = config;

    // No filters
    if (!relationFilters && (!filters || !Object.keys(filters).length)) {
      return null;
    }

    return (
      <div className="model-details-section">
        <Divider />
        <h2>Filters</h2>

        {
          filters
          && Object.keys(filters).length
          && Object.keys(filters).map((filterKey) => (
            <FilterRow
              key={filterKey}
              filterKey={filterKey}
              filter={filters[filterKey]}
            />
          ))
        }

        {relationFilters && (
          <div>
            <br />
            <h3>Filter {modelNameKey} using related documents</h3>
            <br />

            {Object.keys(relationFilters).map((relationName) => (
              <FilterRow
                key={relationName}
                filterKey={relationName}
                filter={{
                  type: 'relationExistance',
                }}
              />
            ))}
            <br />
            {Object.keys(relationFilters).map((relationName) => (
              Object.keys(relationFilters[relationName]).map((filterKey) => (
                <FilterRow
                  key={filterKey}
                  filterKey={filterKey}
                  filter={relationFilters[relationName][filterKey]}
                  prefix={`${snakeCase(relationName)}.`}
                />
              ))
            ))}
          </div>
        )}
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => ({
  relationFilters: getRelationFilters(state, ownProps.modelNameKey),
});

const ConnectedComponent = connect(mapStateToProps)(Filters);
export default ConnectedComponent;

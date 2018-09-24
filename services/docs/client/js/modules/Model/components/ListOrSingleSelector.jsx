import React, { Component } from 'react';
import { Radio } from 'antd';

import connect from 'lib/wrappedConnect';
import { getModelIdColumn } from 'core/selectors/models';


class ListOrSingleSelector extends Component {
  render() {
    const {
      modelName,
      idColumn,
      referrers,
      setReferres,
    } = this.props;

    return (
      <React.Fragment>
        <h4>List of documents or single</h4>

        <Radio.Group value={referrers} onChange={setReferres}>
          <Radio.Button value="*list">
            <strong>/{modelName}/</strong>
          </Radio.Button>
          <Radio.Button value="*single">
            <strong>/{modelName}/&lt;{idColumn}&gt;</strong>
          </Radio.Button>
        </Radio.Group>
      </React.Fragment>
    );
  }
}


const mapStateToProps = (state, ownProps) => ({
  idColumn: getModelIdColumn(state, ownProps.modelNameKey),
});

const ConnectedComponent = connect(mapStateToProps)(ListOrSingleSelector);
export default ConnectedComponent;

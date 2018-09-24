import React, { Component } from 'react';
import { Alert } from 'antd';

import connect from 'lib/wrappedConnect';
import {
  getModelConfigByReferrers,
  getModelDescription,
} from 'core/selectors/models';

import Fields from './Fields.jsx';
import Relations from './Relations.jsx';
import Filters from './Filters.jsx';


class Details extends Component {
  render() {
    const {
      config,
      single,
      modelName,
      modelNameKey,
      level,
      titlePrefix,
      modelDescription,
    } = this.props;

    let resultInfo = (
      <span>Returns a <strong>single</strong> document.</span>
    );
    let resultInfoIcon = 'file-text';

    if (!single && config.paginate && !config.paginate.disabled) {
      resultInfo = (
        <span>Returns a <strong>paginated</strong> list of documents.</span>
      );
      resultInfoIcon = 'copy';
    }
    else if (!single) {
      resultInfo = (
        <span>
          Returns a list of documents, <strong>not paginated</strong>.
        </span>
      );
      resultInfoIcon = 'copy';
    }

    return (
      <div>
        <div className="content">
          <Alert
            message={resultInfo}
            type="success"
            showIcon
            iconType={resultInfoIcon}
          />
        </div>

        {modelDescription && (
          <div className="model-details-section">
            {modelDescription.split('\n\n').map((section, idx) => (
              <p className="leading" key={idx}>{section}</p>
            ))}
          </div>
        )}

        <Fields
          modelNameKey={modelNameKey}
          single={single}
          config={config}
        />
        <Relations
          modelName={modelName}
          modelNameKey={modelNameKey}
          single={single}
          config={config}
          level={level}
          titlePrefix={titlePrefix}
        />
        {!single && (
          <Filters
            modelNameKey={modelNameKey}
            config={config}
          />
        )}
        <p>&nbsp;</p>
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => ({
  config: getModelConfigByReferrers(
    state,
    ownProps.modelNameKey,
    ownProps.referrers
  ),
  modelDescription: getModelDescription(state, ownProps.modelNameKey),
});

const ConnectedComponent = connect(mapStateToProps)(Details);
export default ConnectedComponent;

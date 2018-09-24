import snakeCase from 'lodash/snakeCase';
import React, { Component } from 'react';
import { Row, Col, Drawer, Icon } from 'antd';

import connect from 'lib/wrappedConnect';
import Details from 'modules/Model/components/Details.jsx';


class Relations extends Component {
  constructor(props) {
    super(props);
    this.state = {
      drawerOpen: false,
    };
  }

  onClose = () => {
    this.setState({ drawerOpen: false });
  }

  showDrawer = (event) => {
    this.setState({ drawerOpen: true });
    event.preventDefault();
  }

  render() {
    const {
      relationName,
      relation,
      defaultRelation,
      level,
      single,
      modelName,
      modelNameKey,
      titlePrefix,
      isMaxLevel,
    } = this.props;
    const { drawerOpen } = this.state;
    const referrers = [];
    if (single) {
      referrers.push(`${modelNameKey}.single.${relationName}`);
    }
    referrers.push(`${modelNameKey}.${relationName}`);

    const nextTitlePrefix =
      `${titlePrefix || ''}${modelName}.${snakeCase(relationName)}`;

    return (
      <React.Fragment>
        <Row key={relationName} className="main-row">
          <Col span={16}>
            {snakeCase(relationName)}
          </Col>
          <Col span={4} style={{ textAlign: 'center' }}>
            {!isMaxLevel && defaultRelation && <span>&#10004;</span>}
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            {!isMaxLevel && (
              <a href="#" size='small' onClick={this.showDrawer}>
                See details
                <Icon type="right" />
              </a>
            )}
          </Col>
        </Row>
        {!isMaxLevel && (
          <Drawer
            width={`${70 - ((level || 0) * 10)}%`}
            closable={false}
            onClose={this.onClose}
            visible={drawerOpen}
          >
            <h2>{nextTitlePrefix}</h2>
            <h1>{relation.model}</h1>

            <Details
              modelName={snakeCase(relation.model)}
              modelNameKey={relation.model}
              referrers={referrers}
              single={!!relation.belongsToOneRelation}
              titlePrefix={`${nextTitlePrefix}.`}
              level={level + 1}
            />
          </Drawer>
        )}
      </React.Fragment>
    );
  }
}


const ConnectedComponent = connect()(Relations);
export default ConnectedComponent;

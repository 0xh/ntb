import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import { Layout, Menu, Icon } from 'antd';

import connect from 'lib/wrappedConnect';
import { getModelNames, getModels } from 'core/selectors/models';


const { Sider } = Layout;
const { SubMenu } = Menu;


class LeftColumn extends Component {
  render() {
    const { modelNames } = this.props;

    return (
      <Sider width={280} style={{ background: '#fff' }}>
        <Menu
          mode="inline"
          defaultSelectedKeys={['1']}
          defaultOpenKeys={['modellist']}
          style={{ height: '100%', borderRight: 0 }}
        >
          <Menu.Item key="1">
              <Link to='/'>
              <Icon type="home" theme="twoTone" />
              About Nasjonal Turbase
            </Link>
          </Menu.Item>

          <SubMenu
            key="modellist"
            title={
              <span>
                <Icon type="database" theme="twoTone" />
                Document types
              </span>
            }
          >
            {modelNames.map((modelName, idx) => (
              <Menu.Item key={`model-${idx}`}>
                <Link to={`/${modelName.toLowerCase()}`}>
                  {modelName}
                </Link>
              </Menu.Item>
            ))}
          </SubMenu>
        </Menu>
      </Sider>
    );
  }
}


const mapStateToProps = (state) => ({
  modelNames: getModelNames(state),
  models: getModels(state),
});


const ConnectedComponent = connect(
  mapStateToProps
)(LeftColumn);

export default ConnectedComponent;

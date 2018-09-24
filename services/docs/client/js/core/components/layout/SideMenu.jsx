import snakeCase from 'lodash/snakeCase';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import { Layout, Menu, Icon } from 'antd';

import connect from 'lib/wrappedConnect';
import { getEntryModelNames } from 'core/selectors/models';


const { Sider } = Layout;
const { SubMenu } = Menu;


class SideMenu extends Component {
  render() {
    const { modelNames } = this.props;

    return (
      <Sider
        width={280}
        style={{ background: '#fff' }}
      >
        <Menu
          mode="inline"
          defaultSelectedKeys={['about']}
          defaultOpenKeys={['models']}
          style={{ height: '100%', borderRight: 0 }}
        >
          <Menu.Item key="about">
            <Link to="/">
              <span><Icon type="info-circle" />About NTB</span>
            </Link>
          </Menu.Item>

          <SubMenu
            key="models"
            title={
              <span><Icon type="file-text" />Document types</span>
            }
          >
            {modelNames.map((modelName) => (
              <Menu.Item
                key={modelName}
              >
                <Link
                  to={`/document/${snakeCase(modelName)}`}
                >
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
  modelNames: getEntryModelNames(state),
});


const ConnectedComponent = connect(
  mapStateToProps
)(SideMenu);


export default ConnectedComponent;

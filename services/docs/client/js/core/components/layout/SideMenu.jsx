import snakeCase from 'lodash/snakeCase';
import camelCase from 'lodash/camelCase';
import upperFirst from 'lodash/upperFirst';
import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';

import { Layout, Menu, Icon } from 'antd';

import connect from 'lib/wrappedConnect';
import { getEntryModelNames } from 'core/selectors/models';


const { Sider } = Layout;
const { SubMenu } = Menu;


class SideMenu extends Component {
  render() {
    const { modelNames, location } = this.props;
    let selectedKeys = ['about'];
    const defaultOpenKeys = ['documents'];

    if (location.pathname.startsWith('/document/')) {
      const name = upperFirst(camelCase(
        location.pathname.slice(10).toLowerCase()
      ));
      if (modelNames.includes(name)) {
        selectedKeys = [`document-${name}`];
      }
    }
    if (location.pathname.startsWith('/concepts/')) {
      const name = location.pathname.slice(10).toLowerCase();
      selectedKeys = [`concepts-${name}`];
      defaultOpenKeys.push('concepts');
    }
    if (location.pathname.startsWith('/ut-no/')) {
      const name = location.pathname.slice(7).toLowerCase();
      selectedKeys = [`utno-${name}`];
      defaultOpenKeys.push('utno');
    }

    return (
      <Sider
        width={280}
        style={{ background: '#fff' }}
      >
        <Menu
          mode="inline"
          defaultSelectedKeys={['about']}
          defaultOpenKeys={defaultOpenKeys}
          selectedKeys={selectedKeys}
          style={{ height: '100%', borderRight: 0 }}
        >
          <Menu.Item key="about">
            <Link to="/">
              <span><Icon type="info-circle" />About NTB</span>
            </Link>
          </Menu.Item>

          {/* Concepts */}
          <SubMenu
            key="concepts"
            title={
              <span><Icon type="question-circle" />Concepts</span>
            }
          >
            <Menu.Item key="concepts-pagination">
              <Link to="/concepts/pagination">Pagination</Link>
            </Menu.Item>
            <Menu.Item key="concepts-fields">
              <Link to="/concepts/fields">Fields</Link>
            </Menu.Item>
            <Menu.Item key="concepts-relations">
              <Link to="/concepts/relations">Relations</Link>
            </Menu.Item>
            <Menu.Item key="concepts-relation-parameters">
              <Link to="/concepts/relation-parameters">
                Relation parameters
              </Link>
            </Menu.Item>
            <Menu.Item key="concepts-relation-depth">
              <Link to="/concepts/relation-depth">Relation depth</Link>
            </Menu.Item>
          </SubMenu>

          {/* ut-no */}
          <SubMenu
            key="utno"
            title={
              <span><Icon type="question-circle" />/ut-no</span>
            }
          >
            <Menu.Item key="utno-map-data/compact/spec">
              <Link to="/ut-no/map-data/compact/spec">
                /map-data/compact/spec
              </Link>
            </Menu.Item>
            <Menu.Item key="utno-map-data/compact/cabin">
              <Link to="/ut-no/map-data/compact/cabin">
                /map-data/compact/cabin
              </Link>
            </Menu.Item>
            <Menu.Item key="utno-map-data/compact/poi">
              <Link to="/ut-no/map-data/compact/poi">
                /map-data/compact/poi
              </Link>
            </Menu.Item>
            <Menu.Item key="utno-map-data/compact/trip">
              <Link to="/ut-no/map-data/compact/trip">
                /map-data/compact/trip
              </Link>
            </Menu.Item>
          </SubMenu>

          {/* Document types */}
          <SubMenu
            key="documents"
            title={
              <span><Icon type="file-text" />Document types</span>
            }
          >
            {modelNames.map((modelName) => (
              <Menu.Item
                key={`document-${modelName}`}
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


const ConnectedComponent = withRouter(connect(
  mapStateToProps
)(SideMenu));


export default ConnectedComponent;

import React from 'react';

import { Layout } from 'antd';

import TopBar from './TopBar.jsx';
import SideMenu from './SideMenu.jsx';


const { Content } = Layout;


const CoreLayout = ({ children }) => (
  <Layout>
    <TopBar />

    <Layout>
      <SideMenu />

      <Layout style={{ padding: '0 24px 24px' }}>
        <Content
          style={{
            background: '#fff',
            padding: 24,
            margin: 0,
            minHeight: 280,
          }}
        >
          { children }
        </Content>
      </Layout>

    </Layout>

  </Layout>
);


export default CoreLayout;

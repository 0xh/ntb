import React from 'react';
import PropTypes from 'prop-types';

import { Layout } from 'antd';

import LeftColumn from './LeftColumn.jsx';
import TopBar from './TopBar.jsx';

const { Content } = Layout;


const CoreLayout = ({ children }) => (
  <Layout>
    <TopBar />

    <Layout>
      <LeftColumn />

      <Layout style={{ padding: '0 24px 24px' }}>
        <Content
          style={{
            background: '#fff',
            padding: 24,
            margin: '16px 0',
            minHeight: 280,
          }}
        >
          { children }
        </Content>
      </Layout>
    </Layout>
  </Layout>
);


CoreLayout.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};


export default CoreLayout;

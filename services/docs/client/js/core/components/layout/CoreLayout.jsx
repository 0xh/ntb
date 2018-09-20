import React from 'react';
import PropTypes from 'prop-types';

import { Layout } from 'antd';


const CoreLayout = ({ children }) => (
  <Layout>
    <Layout
      className="page"
      style={{ position: 'relative' }}>
      <h1>NTB API Documentation</h1>
      <hr />
      { children }
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

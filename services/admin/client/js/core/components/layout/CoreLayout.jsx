import React from 'react';
import PropTypes from 'prop-types';

import { Layout, Row, Col } from 'antd';


const { Header } = Layout;


const CoreLayout = ({ children }) => (
  <Layout>
    <Header style={{ marginBottom: '20px' }}>
      <Row className="page">
        <Col span={18}>
          Header
        </Col>
        <Col span={6}>
          Logg inn
        </Col>
      </Row>
    </Header>
    <Layout
      className="page"
      style={{ position: 'relative' }}>
      { children }
    </Layout>
  </Layout>
);


CoreLayout.propTypes = {
  children: PropTypes.element.isRequired,
};


export default CoreLayout;

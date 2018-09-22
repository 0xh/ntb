import React from 'react';

import { Layout } from 'antd';


const { Header } = Layout;

const TopBar = ({ children }) => (
  <Header className="header">
    <div className="header-logo">
      NTB
      <span>Under development</span>
    </div>
  </Header>
);


export default TopBar;

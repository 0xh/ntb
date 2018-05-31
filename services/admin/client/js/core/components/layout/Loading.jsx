import React from 'react';
import PropTypes from 'prop-types';

import { Spin } from 'antd';


const Loading = ({ text }) => (
  <div className="loading-container">
    <Spin tip={text || null} />
  </div>
);


Loading.propTypes = {
  text: PropTypes.string,
};


export default Loading;

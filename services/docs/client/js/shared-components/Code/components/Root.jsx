import React from 'react';


const Root = ({ children }) => (
  <React.Fragment>
    {' '}
    <span className="code-snippet">
      {children}
    </span>
  </React.Fragment>
);


export default Root;

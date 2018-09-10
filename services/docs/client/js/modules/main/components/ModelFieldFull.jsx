import React from 'react';


const ModelFieldFull = ({ data, fullFields }) => {
  const { name } = data;
  return (fullFields || []).includes(name)
    ? <span>&#10004;</span>
    : <span>&nbsp;</span>;
};


export default ModelFieldFull;

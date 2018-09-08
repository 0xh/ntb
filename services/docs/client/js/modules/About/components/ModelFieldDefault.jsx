import React from 'react';


const ModelFieldDefault = ({ data, defaultFields }) => {
  const { name } = data;
  return defaultFields.includes(name)
    ? <span>&#10004;</span>
    : <span>&nbsp;</span>;
};


export default ModelFieldDefault;

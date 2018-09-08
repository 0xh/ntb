import React from 'react';


const ModelFieldDefault = ({ fieldName, defaultFields }) => (
  defaultFields.includes(fieldName)
    ? <span>&#10004;</span>
    : <span>&nbsp;</span>
);


export default ModelFieldDefault;

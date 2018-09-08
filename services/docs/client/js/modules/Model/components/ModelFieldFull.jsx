import React from 'react';


const ModelFieldFull = ({ fieldName, fullFields }) => (
  (fullFields || []).includes(fieldName)
    ? <span>&#10004;</span>
    : <span>&nbsp;</span>
);


export default ModelFieldFull;

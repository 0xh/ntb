import React from 'react';


const ModelFieldReturnable = ({ fieldName, schema }) => {
  const fieldSchema = schema.properties[fieldName];
  return fieldSchema.noApiReturn
    ? <span>&nbsp;</span>
    : <span>&#10004;</span>;
};


export default ModelFieldReturnable;

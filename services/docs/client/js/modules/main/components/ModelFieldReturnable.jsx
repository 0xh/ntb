import React from 'react';


const ModelFieldReturnable = ({ data, schema }) => {
  const { name } = data;
  const fieldSchema = schema.properties[name];
  return fieldSchema.noApiReturn
    ? <span>&nbsp;</span>
    : <span>&#10004;</span>;
};


export default ModelFieldReturnable;

import React from 'react';


const ModelFieldReadOnly = ({ data, schema }) => {
  const { name } = data;
  const fieldSchema = schema.properties[name];
  return fieldSchema.readOnly
    ? <span>&#10004;</span>
    : <span>&nbsp;</span>;
};


export default ModelFieldReadOnly;

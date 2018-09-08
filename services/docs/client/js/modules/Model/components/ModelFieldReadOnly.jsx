import React from 'react';


const ModelFieldReadOnly = ({ fieldName, schema }) => {
  const fieldSchema = schema.properties[fieldName];
  return fieldSchema.readOnly
    ? <span>&#10004;</span>
    : <span>&nbsp;</span>;
};


export default ModelFieldReadOnly;

import React from 'react';


function getDescriptionByTypeKey(typeKey) {
  switch (typeKey) {
    case 'string.uuid':
      return <span>uuid</span>;
    case 'string.date':
      return <span>datetime</span>;
    case 'string.email':
      return <span>e-mail</span>;
    case 'string':
      return <span>text</span>;
    case 'boolean':
      return <span>boolean</span>;
    default:
      return <em title={typeKey}>UNKNOWN</em>;
  }
}


const ModelFieldType = ({ data, schema }) => {
  const { name } = data;
  const fieldSchema = schema.properties[name];
  const formatKey = fieldSchema.format
    ? `.${fieldSchema.format}`
    : '';
  const typeKey = `${fieldSchema.type}${formatKey}`;
  return getDescriptionByTypeKey(typeKey);
};


export default ModelFieldType;

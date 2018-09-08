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
    case 'number':
      return <span>number</span>;
    case 'boolean':
      return <span>boolean</span>;
    case 'object':
      return <span><em>object</em></span>;
    default:
      return <em title={typeKey}>UNKNOWN</em>;
  }
}


const ModelFieldType = ({ fieldName, schema }) => {
  let fieldSchema;

  if (!Array.isArray(fieldName)) {
    fieldSchema = schema.properties[fieldName];
  }
  else {
    fieldSchema = schema.properties[fieldName[0]];
    fieldName.slice(1).forEach((subFieldName) => {
      if (fieldSchema.type === 'object') {
        fieldSchema = fieldSchema.properties[subFieldName];
      }
    });
  }

  const formatKey = fieldSchema.format
    ? `.${fieldSchema.format}`
    : '';
  const typeKey = `${fieldSchema.type}${formatKey}`;

  return getDescriptionByTypeKey(typeKey);
};


export default ModelFieldType;

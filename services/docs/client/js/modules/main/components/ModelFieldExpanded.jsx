import React from 'react';

import ModelFieldSubFieldList from './ModelFieldSubFieldList.jsx';


const ModelFieldExpanded = ({ data, schema }) => {
  const { name } = data;
  const fieldSchema = schema.properties[name];

  if (fieldSchema.type === 'object') {
    return (
      <ModelFieldSubFieldList
        fieldSchema={fieldSchema}
      />
    );
  }

  return <p>
    {name}
    {JSON.stringify(fieldSchema)}
  </p>;
};


export default ModelFieldExpanded;

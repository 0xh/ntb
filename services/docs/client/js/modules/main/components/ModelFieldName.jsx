import React from 'react';
import snakeCase from 'lodash/snakeCase';


const ModelFieldName = ({ data }) => {
  const { name } = data;
  return <span>{snakeCase(name)}</span>;
};


export default ModelFieldName;

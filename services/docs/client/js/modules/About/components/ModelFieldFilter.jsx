import React from 'react';


const ModelFieldFilter = ({ data, validFilters }) => {
  const { name } = data;
  const valid = Object.keys(validFilters).includes(name);
  return valid
    ? <span>&#10004;</span>
    : <span>&nbsp;</span>;
};


export default ModelFieldFilter;

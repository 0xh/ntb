import React from 'react';


const ModelFieldFilter = ({ fieldName, validFilters, single }) => {
  const valid = Object.keys(validFilters).includes(fieldName);
  return valid && !single
    ? <span>&#10004;</span>
    : <span>&nbsp;</span>;
};


export default ModelFieldFilter;

import React from 'react';


const ModelDescription = ({
  config,
  belongsToOneRelation,
  referrer,
  name,
}) => {
  let description;
  if (config.single || belongsToOneRelation) {
    description = 'Returns a single document.';
  }
  else if (config.paginate) {
    description = 'Returns a paginated list of documents.';
  }
  else {
    description = 'Returns a list of documents. Not paginated.';
  }

  const nameElm = ['*list', '*single'].includes(referrer[0])
    ? null
    : (
      <h4 style={{ marginBottom: '5px' }}>
        {name}
      </h4>
    );

  return (
    <p>
      {nameElm}
      {description}
    </p>
  );
};


export default ModelDescription;

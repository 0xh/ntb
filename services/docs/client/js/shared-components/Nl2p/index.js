import React from 'react';


export default (props) => (
  (props.text || '').split('\n\n').map((block, idx) => (
    <p key={idx}>{block}</p>
  ))
);

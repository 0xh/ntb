import React from 'react';
import { Button } from 'antd';


const ListSingleReferrerSelector = ({ referrer, onChange }) => (
  <React.Fragment>
    <h4>Select mode to get correct options</h4>
    <Button.Group>
      <Button
        type={referrer === '*list' ? 'primary' : null}
        onClick={() => onChange('*list')}
      >
        /cabin - list of documents
      </Button>
      <Button
        type={referrer === '*single' ? 'primary' : null}
        onClick={() => onChange('*single')}
      >
        /cabin/&lt;id&gt; - single document
      </Button>
    </Button.Group>
  </React.Fragment>
);


export default ListSingleReferrerSelector;

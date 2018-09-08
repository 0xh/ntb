import React from 'react';
import snakeCase from 'lodash/snakeCase';

import { List, Collapse } from 'antd';

import Model from './Model.jsx';


const { Panel } = Collapse;


const ModelRelationList = ({ relations, referrerModel, referrerIsSingle }) => {
  const relationNames = Object.keys(relations);

  // Return null if no relations are defined
  if (!relationNames.length) {
    return null;
  }

  return (
    <div>
      <h3 style={{ marginTop: '1em' }}>Relations</h3>
      <List
        itemLayout="vertical">
        {Object.keys(relations).map((relationName) => (
            <Collapse bordered={false} key={relationName}>
              <Panel
                header={`${snakeCase(relationName)}`}
                style={{ borderLeft: '2px solid #aaa' }}
              >
                  <div
                    style={{ marginLeft: '3em' }}
                  >
                    <Model
                      name={relations[relationName].model}
                      belongsToOneRelation={
                        relations[relationName].belongsToOneRelation
                      }
                      referrer={[
                        (
                          referrerIsSingle
                            ? `${referrerModel}.single.${relationName}`
                            : null
                        ),
                        `${referrerModel}.${relationName}`,
                      ].filter((v) => v)} />
                  </div>
              </Panel>
            </Collapse>
        ))}
      </List>
    </div>
  );
};


export default ModelRelationList;

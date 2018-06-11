import React from 'react';

import { Table } from 'antd';

import ModelFieldName from './ModelFieldName.jsx';
import ModelFieldType from './ModelFieldType.jsx';


const renderModelFieldName = (data) => <ModelFieldName data={data} />;
const renderModelFieldType = (data, schema) => (
  <ModelFieldType
    data={data}
    schema={schema}
  />
);


function createDataSource(fieldSchema) {
  return Object.keys(fieldSchema.properties)
    .map((name, idx) => ({ key: idx, name }));
}


function createColumns(fieldSchema) {
  const columns = [
    {
      title: 'Subfield name',
      key: 'name',
      render: renderModelFieldName,
    },
    {
      title: 'Type',
      key: 'type',
      render: (data) => renderModelFieldType(data, fieldSchema),
    },
    // {
    //   title: 'Type',
    //   key: 'type',
    //   render: (data) => {
    //     const { name } = data;
    //     const subFieldSchema = fieldSchema.properties[name];
    //     const formatKey = subFieldSchema.format
    //       ? `.${subFieldSchema.format}`
    //       : '';
    //     const typeKey = `${subFieldSchema.type}${formatKey}`;
    //     return this.getTypeDescription(typeKey);
    //   },
    // },
  ];

  return columns;
}


const ModelFieldSubFieldList = ({ fieldSchema }) => (
  <Table
    className='sub-table'
    dataSource={createDataSource(fieldSchema)}
    columns={createColumns(fieldSchema)}
    size='small'
    pagination={false}
    style={{
      marginLeft: '-16px',
      marginRight: '-16px',
    }}
  />
);


export default ModelFieldSubFieldList;

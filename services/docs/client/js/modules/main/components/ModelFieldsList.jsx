import React from 'react';

import { Table } from 'antd';

import ModelFieldName from './ModelFieldName.jsx';
import ModelFieldType from './ModelFieldType.jsx';
import ModelFieldFilter from './ModelFieldFilter.jsx';
import ModelFieldReturnable from './ModelFieldReturnable.jsx';
import ModelFieldReadOnly from './ModelFieldReadOnly.jsx';
import ModelFieldDefault from './ModelFieldDefault.jsx';
import ModelFieldFull from './ModelFieldFull.jsx';
import ModelFieldExpanded from './ModelFieldExpanded.jsx';


function getDefaultFields(config) {
  const { defaultFields, fullFields } = config;
  let fields = [];

  defaultFields.forEach((field) => {
    if (field === '*full') {
      fields = [].concat(fields, fullFields);
    }
    else if (field.startsWith('-')) {
      fields = fields.filter((f) => f !== field);
    }
    else {
      fields.push(field);
    }
  });

  return Array.from(new Set(fields));
}


const renderModelFieldName = (data) => <ModelFieldName data={data} />;
const renderModelFieldType = (data, schema) => (
  <ModelFieldType
    data={data}
    schema={schema}
  />
);
const renderModelFieldFilter = (data, validFilters) => (
  <ModelFieldFilter
    data={data}
    validFilters={validFilters}
  />
);
const renderModelFieldReturnable = (data, schema) => (
  <ModelFieldReturnable
    data={data}
    schema={schema}
  />
);
const renderModelFieldReadOnly = (data, schema) => (
  <ModelFieldReadOnly
    data={data}
    schema={schema}
  />
);
const renderModelFieldDefault = (data, defaultFields) => (
  <ModelFieldDefault
    data={data}
    defaultFields={defaultFields}
  />
);
const renderModelFieldFull = (data, fullFields) => (
  <ModelFieldFull
    data={data}
    fullFields={fullFields}
  />
);
const renderExpanded = (data, schema) => (
  <ModelFieldExpanded
    data={data}
    schema={schema}
  />
);


function getRowClassName(data, schema) {
  const { name } = data;
  const fieldSchema = schema.properties[name];

  return fieldSchema.type === 'object' && fieldSchema.properties
    ? ''
    : 'hide-expand';
}


function createColumns(config, schema, single) {
  const defaultFields = getDefaultFields(config);
  const { fullFields, validFilters } = config;

  let columns = [
    {
      title: 'Field name',
      key: 'name',
      render: renderModelFieldName,
    },
    {
      title: 'Type',
      key: 'type',
      render: (data) => renderModelFieldType(data, schema),
    },
  ];


  if (!single) {
    columns = [].concat(columns, [
      {
        title: 'Filter',
        key: 'filter',
        render: (data) => renderModelFieldFilter(data, validFilters),
      },
    ]);
  }

  columns = [].concat(columns, [
    {
      title: 'Returnable',
      key: 'returnable',
      render: (data) => renderModelFieldReturnable(data, schema),
    },
    {
      title: 'Read only',
      key: 'readonly',
      render: (data) => renderModelFieldReadOnly(data, schema),
    },
    {
      title: '*default',
      key: 'default',
      render: (data) => renderModelFieldDefault(data, defaultFields),
    },
    {
      title: '*full',
      key: 'full',
      render: (data) => renderModelFieldFull(data, fullFields),
    },
  ]);

  return columns;
}


const ModelFieldsList = ({ config, schema, single }) => {
  const dataSource = Object.keys(schema.properties)
    .map((name, idx) => ({ key: idx, name }));

  return (
    <Table
      dataSource={dataSource}
      columns={createColumns(config, schema, single)}
      size='small'
      pagination={false}
      expandedRowRender={(data) => renderExpanded(data, schema)}
      rowClassName={(data) => getRowClassName(data, schema)}
      style={{
        marginLeft: '-16px',
        marginRight: '-16px',
      }}
    />
  );
};


export default ModelFieldsList;

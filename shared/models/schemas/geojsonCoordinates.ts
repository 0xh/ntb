import { JsonSchema } from '@ntb/db-utils';


const schema: JsonSchema = {
  type: 'array',
  items: [
    { type: 'number' },
    { type: 'number' },
    { type: ['number', 'null'] },
  ],
};

export default schema;

import { JsonSchema } from '@ntb/db-utils';


const schema: JsonSchema = {
  type: 'string',
  enum: [
    'winter',
    'summer',
    'interior',
    'other',
  ],
};

export default schema;

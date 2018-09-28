import { JsonSchema } from '@ntb/db-utils';


const schema: JsonSchema = {
  type: 'string',
  enum: [
    'easy',
    'moderate',
    'tough',
    'very tough',
  ],
};

export default schema;

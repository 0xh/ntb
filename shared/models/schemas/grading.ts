import { JsonSchema } from '@ntb/db-utils';


const schema: JsonSchema = {
  type: 'string',
  enum: [
    'easy',
    'moderate',
    'tough',
    'very tough',
    'moderate',
  ],
};

export default schema;

import { JsonSchema } from '@ntb/db-utils';


const schema: JsonSchema = {
  type: 'string',
  enum: [
    'private',
    'draft',
    'deleted',
    'public',
  ],
};

export default schema;

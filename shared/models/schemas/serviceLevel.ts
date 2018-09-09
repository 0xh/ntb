import { JsonSchema } from '@ntb/db-utils';


const schema: JsonSchema = {
  type: 'string',
  enum: [
    'self-service',
    'staffed',
    'no-service',
    'closed',
    'food service',
    'no-service (no beds)',
    'emergency shelter',
  ],
};

export default schema;

import { JsonSchema } from '@ntb/db-utils';


const schema: JsonSchema = {
  type: 'string',
  enum: [
    'price',
    'weather',
    'video',
    'booking',
    'homepage',
    'facebook',
    'twitter',
    'instagram',
    'contact info',
    'other',
  ],
};

export default schema;

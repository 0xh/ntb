import { JsonSchema } from '@ntb/db-utils';

import geojsonCoordinates from './geojsonCoordinates';


const schema: JsonSchema = {
  type: 'object',
  geojsonType: 'LineString',
  properties: {
    type: { type: 'string', enum: ['LineString'] },
    coordinates: {
      type: 'array',
      items: { ...geojsonCoordinates },
    },
  },
};

export default schema;

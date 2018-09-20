import { JsonSchema } from '@ntb/db-utils';

import geojsonCoordinates from './geojsonCoordinates';


const schema: JsonSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['Polygon'] },
    coordinates: {
      type: 'array',
      items: { ...geojsonCoordinates },
    },
  },
};

export default schema;
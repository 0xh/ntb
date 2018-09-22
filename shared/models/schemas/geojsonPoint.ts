import { JsonSchema } from '@ntb/db-utils';

import geojsonCoordinates from './geojsonCoordinates';


const schema: JsonSchema = {
  type: 'object',
  geojsonType: 'Point',
  properties: {
    type: { type: 'string', enum: ['Point'] },
    coordinates: geojsonCoordinates,
  },
};

export default schema;

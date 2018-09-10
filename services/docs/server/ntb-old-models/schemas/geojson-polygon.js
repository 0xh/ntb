export default {
  type: 'object',
  required: ['type', 'coordinates'],
  properties: {
    type: { const: 'Polygon' },
    coordinates: {
      type: 'array',
      items: {
        type: 'array',
        items: [
          {
            type: 'number',
            minimum: -90,
            maximum: 90,
          },
          {
            type: 'number',
            minimum: -180,
            maximum: 180,
          },
        ],
      },
    },
  },
};

import BaseModel from './BaseModel';
import DocumentStatusSchema from './schemas/document-status';


export default class RouteSegment extends BaseModel {
  static tableName = 'routeSegments';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];

  get uri() {
    return `route_segment/${this.id}`;
  }

  static relationMappings = {
    routes: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'routeSegments.id',
        through: {
          modelClass: 'RouteToRouteSegment',
          from: 'routesToRouteSegments.routeId',
          to: 'routesToRouteSegments.routeSegmentId',
        },
        to: 'routes.id',
      },
    },
  };


  static geometryAttributes = [
    'geometry',
  ];


  static jsonSchema = {
    type: 'object',
    required: [
      'type',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { type: 'string', format: 'uuid', readOnly: true },
      gml_ids: {
        type: 'array',
        items: [
          {
            type: 'string',
          },
        ],
      },
      maintainers: {
        type: 'array',
        items: [
          {
            type: 'string',
          },
        ],
      },
      calculatedDistance: { type: 'number' },
      geometry: { type: 'object' },
      dataSource: { type: 'string' },
      updatedAt: { type: 'string', format: 'date', readOnly: true },
      createdAt: { type: 'string', format: 'date', readOnly: true },
    },
  };


  static APIEntryModel = true;


  static getAPIConfig() {
    const config = {};

    // Configuration when it's the entry model
    config['*list'] = {
      paginate: true,
      fullTextSearch: true,
      ordering: true,

      defaultLimit: 10,
      maxLimit: 50,
      validOrderFields: [
        'id',
        'updatedAt',
        'createdAt',
      ],
      defaultOrder: [['id', 'ASC']],
      validFilters: {
        id: {},
      },
      fullFields: [
        'uri',
        'id',
        'maintainers',
        'calculatedDistance',
        'geometry',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [
        'routes',
      ],
    };

    // Default configuration when an instance in accessed directly
    config['*single'] = config['*list'];

    // Default configuration when included from another model
    config.default = {
      ...config['*list'],
      defaultFields: [
        'uri',
        'id',
        'maintainers',
        'calculatedDistance',
        'geometry',
      ],

      defaultRelations: [],
    };

    return config;
  }


  static getAPIFieldsToAttributes(referrer, fields) {
    const extra = {
      // Related extra field from Accessability
      cabinAccessabilityDescription: ['cabinAccessabilityDescription'],
      waymarkWinter: [
        'waymarkWinterAllYear',
        'waymarkWinterFrom',
        'waymarkWinterTo',
        'waymarkWinterComment',
      ],
      duration: [
        'durationMinutes',
        'durationHours',
        'durationDays',
      ],
    };

    const attributes = super.getAPIFieldsToAttributes(referrer, fields, extra);

    return attributes;
  }
}

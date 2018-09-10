import BaseModel from './BaseModel';


export default class RouteWaymarkType extends BaseModel {
  static tableName = 'routeWaymarkTypes';
  static idColumn = 'name';
  static virtualAttributes = ['uri'];


  get uri() {
    return `route_waymark_type/${this.name}`;
  }


  static relationMappings = {
    routes: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'routeWaymarkTypes.name',
        through: {
          modelClass: 'RouteToRouteWaymarkType',
          from: 'routesToRouteWaymarkTypes.routeWaymarkTypeName',
          to: 'routesToRouteWaymarkTypes.routeId',
        },
        to: 'routes.id',
      },
    },
  };


  static jsonSchema = {
    type: 'object',
    required: [
      'name',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      name: { type: 'string' },
      description: { type: 'string' },
    },
  };


  static APIEntryModel = true;

  static getAPIConfig() {
    const config = {};

    // Configuration when it's the entry model
    config['*list'] = {
      paginate: false,
      fullTextSearch: false,
      ordering: true,
      defaultOrder: [['name', 'ASC']],
      validOrderFields: ['name'],
      validFilters: {
        name: { filterTypes: ['=', '$in', '$nin'] },
      },
      fullFields: [
        'name',
        'description',
      ],
      defaultFields: [
        'name',
        'description',
      ],
      defaultRelations: [],
    };

    // Default configuration when an instance in accessed directly
    config['*single'] = config['*list'];

    // Default configuration when included from another model
    config.default = {
      ...config['*list'],
      defaultFields: ['name'],
    };

    return config;
  }


  static getAPIFieldsToAttributes(referrer, fields) {
    const extra = {};

    const attributes = super.getAPIFieldsToAttributes(referrer, fields, extra);

    return attributes;
  }
}

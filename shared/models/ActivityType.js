import BaseModel from './BaseModel';


export default class ActivityType extends BaseModel {
  static tableName = 'activityTypes';
  static idColumn = 'name';
  static virtualAttributes = ['uri'];


  get uri() {
    return `accessability/${this.name}`;
  }


  static relationMappings = {
    subActivityTypes: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'ActivityType',
      join: {
        from: 'activityTypes.name',
        through: {
          modelClass: 'ActivityTypesToActivityTypes',
          from: 'activityTypesToActivityTypes.primaryType',
          to: 'activityTypesToActivityTypes.subType',
        },
        to: 'activityTypes.name',
      },
    },
    primaryActivityTypes: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'ActivityType',
      join: {
        from: 'activityTypes.name',
        through: {
          modelClass: 'ActivityTypesToActivityTypes',
          from: 'activityTypesToActivityTypes.subType',
          to: 'activityTypesToActivityTypes.primaryType',
        },
        to: 'activityTypes.name',
      },
    },
    routes: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'activityTypes.name',
        through: {
          modelClass: 'RouteToActivityType',
          from: 'routesToActivityTypes.activityTypeName',
          to: 'routesToActivityTypes.routeId',
        },
        to: 'routes.id',
      },
    },
    trips: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'activityTypes.name',
        through: {
          modelClass: 'TripToActivityType',
          from: 'tripsToActivityTypes.activityTypeName',
          to: 'tripsToActivityTypes.tripId',
        },
        to: 'trips.id',
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
      primary: { type: 'boolean' },
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
      defaultOrder: [
        ['primary', 'DESC'],
        ['name', 'ASC'],
      ],
      validOrderFields: [
        'name',
        'primary',
      ],
      validFilters: {
        name: {},
        primary: {},
      },
      fullFields: [
        'name',
        'primary',
        'description',
      ],
      defaultFields: [
        'name',
        'primary',
        'description',
      ],
      defaultRelations: [],
    };

    // Default configuration when an instance in accessed directly
    config['*single'] = config['*list'];

    // Default configuration when included from another model
    config.default = {
      ...config['*list'],
      defaultFields: [
        'name',
        'primary',
      ],
      defaultRelations: [],
    };

    return config;
  }


  static getAPIFieldsToAttributes(referrer, fields) {
    const extra = {};

    const attributes = super.getAPIFieldsToAttributes(referrer, fields, extra);

    return attributes;
  }
}

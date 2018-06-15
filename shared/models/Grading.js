import BaseModel from './BaseModel';


export default class Grading extends BaseModel {
  static tableName = 'gradings';
  static idColumn = 'name';
  static virtualAttributes = ['uri'];


  get uri() {
    return `grading/${this.name}`;
  }


  static relationMappings = {
    trips: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'gradings.name',
        to: 'trips.grading',
      },
    },
    routes: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'Route',
      join: {
        from: 'gradings.name',
        to: 'routes.grading',
      },
    },
  };


  static jsonSchema = {
    type: 'object',
    required: [
      'name',
    ],

    properties: {
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
        name: { filterTypes: ['=', '$in', '$nin'] }
      },
      fullFields: [
        'name',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [],
    };

    // Default configuration when an instance in accessed directly
    config['*single'] = config['*list'];

    // Default configuration when included from another model
    config.default = {
      ...config['*list'],
      defaultFields: [
        'uri',
        'id',
        'name',
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

import BaseModel from './BaseModel';


export default class CabinServiceLevel extends BaseModel {
  static tableName = 'cabinServiceLevels';
  static idColumn = 'name';
  static virtualAttributes = ['uri'];


  get uri() {
    return `cabin_service_level/${this.name}`;
  }


  static relationMappings = {
    cabins: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'cabinServiceLevels.name',
        to: 'cabins.serviceLevel',
      },
    },
    cabinsThroughOpeningHours: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'cabinServiceLevels.name',
        through: {
          modelClass: 'CabinOpeningHours',
          from: 'cabinOpeningHours.serviceLevel',
          extra: {
            openAllYear: 'allYear',
            openFrom: 'from',
            openTo: 'to',
          },
          to: 'cabinOpeningHours.cabinId',
        },
        to: 'cabins.id',
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
      validFilters: {},
      fullFields: [
        'name',
        'description',
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

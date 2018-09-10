import BaseModel from './BaseModel';


export default class Accessability extends BaseModel {
  static tableName = 'accessabilities';
  static idColumn = 'name';
  static virtualAttributes = ['uri'];


  get uri() {
    return `accessability/${this.name}`;
  }


  static relationMappings = {
    cabins: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'accessabilities.name',
        through: {
          modelClass: 'CabinAccessability',
          extra: { cabinAccessabilityDescription: 'description' },
          from: 'cabinAccessabilities.accessabilityName',
          to: 'cabinAccessabilities.cabinId',
        },
        to: 'cabins.id',
      },
    },
    trips: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'accessabilities.name',
        through: {
          modelClass: 'TripAccessability',
          extra: { tripAccessabilityDescription: 'description' },
          from: 'tripAccessabilities.accessabilityName',
          to: 'tripAccessabilities.tripId',
        },
        to: 'trips.id',
      },
    },
    pois: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'accessabilities.name',
        through: {
          modelClass: 'PoiAccessability',
          extra: { poiAccessabilityDescription: 'description' },
          from: 'poiAccessabilities.accessabilityName',
          to: 'poiAccessabilities.poiId',
        },
        to: 'pois.id',
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

    // Configuration when included through Cabin.accessabilities
    config['Cabin.accessabilities'] = {
      ...config.default,
      defaultFields: [
        ...config.default.defaultFields,
        'cabinAccessabilityDescription',
      ],
    };

    return config;
  }


  static getAPIFieldsToAttributes(referrer, fields) {
    const extra = {
      // Related extra field from Cabin
      cabinAccessabilityDescription: ['cabinAccessabilityDescription'],
    };

    const attributes = super.getAPIFieldsToAttributes(referrer, fields, extra);

    return attributes;
  }
}

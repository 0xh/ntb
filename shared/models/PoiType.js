import BaseModel from './BaseModel';


export default class PoiType extends BaseModel {
  static tableName = 'poiTypes';
  static idColumn = 'name';
  static virtualAttributes = ['uri'];


  get uri() {
    return `poi_type/${this.name}`;
  }


  static relationMappings = {
    pois: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'poiTypes.name',
        through: {
          modelClass: 'PoiToPoiType',
          extra: { primaryPoiType: 'primary' },
          from: 'poisToPoiTypes.poiType',
          to: 'poisToPoiTypes.poiId',
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

    // Configuration when included through Poi.poiTypes
    config['Poi.poiTypes'] = {
      ...config.default,
      defaultFields: [
        ...config.default.defaultFields,
        'primaryPoiType',
      ],
    };

    return config;
  }


  static getAPIFieldsToAttributes(referrer, fields) {
    const extra = {
      // Related extra field from PoiType
      primaryPoiType: ['primaryPoiType'],
    };

    const attributes = super.getAPIFieldsToAttributes(referrer, fields, extra);

    return attributes;
  }
}

import BaseModel from './BaseModel';


export default class Facility extends BaseModel {
  static tableName = 'facilities';
  static idColumn = 'name';
  static virtualAttributes = ['uri'];


  get uri() {
    return `facility/${this.name}`;
  }


  static relationMappings = {
    // TODO(roar):
    // pois

    cabins: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'facilities.name',
        through: {
          modelClass: 'CabinFacility',
          extra: { cabinFacilityDescription: 'description' },
          from: 'cabinFacilities.facilityName',
          to: 'cabinFacilities.cabinId',
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
      ordering: false,
      defaultOrder: [['name', 'ASC']],
      validOrderFields: ['name'],
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

    // Configuration when included through Cabin.facilities
    config['Cabin.facilities'] = {
      ...config.default,
      defaultFields: [
        ...config.default.defaultFields,
        'cabinFacilityDescription',
      ],
    };

    return config;
  }


  static getAPIFieldsToAttributes(referrer, fields) {
    const extra = {
      // Related extra field from Cabin
      cabinFacilityDescription: 'cabinFacilityDescription',
    };

    const attributes = super.getAPIFieldsToAttributes(referrer, fields, extra);

    return attributes;
  }
}

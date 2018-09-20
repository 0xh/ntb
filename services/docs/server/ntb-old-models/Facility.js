import BaseModel from './BaseModel';


export default class Facility extends BaseModel {
  static tableName = 'facilities';
  static idColumn = 'name';
  static virtualAttributes = ['uri'];


  get uri() {
    return `facility/${this.name}`;
  }


  static relationMappings = {
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


  $parseDatabaseJson(databaseJson) {
    const json = super.$parseDatabaseJson(databaseJson);

    // Remove empty cabinFacilityDescription
    if (
      !json.cabinFacilityDescription
      || json.cabinFacilityDescription.trim() === ''
    ) {
      json.cabinFacilityDescription = null;
    }

    return json;
  }


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
      validFilters: {
        name: { filterTypes: ['=', '$in', '$nin'] },
      },
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
      cabinFacilityDescription: ['cabinFacilityDescription'],
    };

    const attributes = super.getAPIFieldsToAttributes(referrer, fields, extra);

    return attributes;
  }
}

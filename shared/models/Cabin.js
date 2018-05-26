import BaseModel from './BaseModel';


export default class Cabin extends BaseModel {
  static tableName = 'cabins';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];


  get uri() {
    return `cabin/${this.id}`;
  }


  static relationMappings = {
    areas: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Area',
      join: {
        from: 'cabins.id',
        through: {
          modelClass: 'CabinToArea',
          from: 'cabinsToAreas.cabinId',
          to: 'cabinsToAreas.areaId',
        },
        to: 'areas.id',
      },
    },
    facilities: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Facility',
      join: {
        from: 'cabins.id',
        through: {
          modelClass: 'CabinFacility',
          from: 'cabinFacilities.cabinId',
          to: 'cabinFacilities.facilityName',
        },
        to: 'facilities.name',
      },
    },
    accessabilities: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Accessability',
      join: {
        from: 'cabins.id',
        through: {
          modelClass: 'CabinAccessability',
          from: 'cabinAccessabilities.cabinId',
          to: 'cabinAccessabilities.facilityName',
        },
        to: 'accessabilities.name',
      },
    },
  };


  static jsonSchema = {
    type: 'object',
    required: [
      'dntCabin',
      'dntDiscount',
      'name',
      'provider',
      'status',
    ],

    properties: {
      uri: { type: 'text', readOnly: true },
      id: { format: 'uuid', readOnly: true },
      idLegacyNtb: { type: 'text', readOnly: true },
      dntCabin: { type: 'boolean', default: false },
      dntDiscount: { type: 'boolean', default: false },
      name: { type: 'text', minLength: 2, maxLength: 100 },
      nameAlt: {
        type: 'array',
        items: [
          {
            type: 'text',
            minLength: 2,
            maxLength: 100,
          },
        ],
      },
      description: { type: 'text', maxLength: 100000 },
      contact: {
        type: 'object',
        properties: {
          contactName: { type: 'text', maxLength: 100 },
          email: { type: 'text', format: 'email', maxLength: 100 },
          phone: { type: 'text', maxLength: 100 },
          mobile: { type: 'text', maxLength: 100 },
          fax: { type: 'text', maxLength: 100 },
          address1: { type: 'text', maxLength: 100 },
          address2: { type: 'text', maxLength: 100 },
          postalCode: { type: 'text', maxLength: 100 },
          postalName: { type: 'text', maxLength: 100 },
        },
      },
      url: { type: 'text', maxLength: 100 },
      yearOfConstruction: { type: 'text', maxLength: 100 },
      coordinates: { type: 'object' },
      map: { type: 'text', maxLength: 300 },
      mapAlt: { type: 'array', items: [{ type: 'text', maxLength: 400 }] },
      c2aCreatedAt: {
        format: 'date',
        readOnly: true,
        availableForReferrers: [
          'Area.children',
        ],
      },
      license: { type: 'text', maxLength: 300 },
      provider: { type: 'text', maxLength: 300, readOnly: true },
      status: { $ref: 'DocumentStatus' },
      updatedAt: { format: 'date', readOnly: true },
      createdAt: { format: 'date', readOnly: true },
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
        'name',
        'updatedAt',
        'createdAt',
      ],
      defaultOrder: [['name', 'ASC']],
      defaultFields: [
        'uri',
        'id',
        'name',
        'description',
        'map',
        'url',
        'license',
        'provider',
        'status',
        'updatedAt',
      ],
      defaultRelations: [],
    };

    // Default configuration when included from another model
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
    const attrs = this.getBaseFields(referrer);
    const attributes = [].concat(...fields.map((field) => {
      switch (field) {
        case 'uri':
          return null;
        default:
          return null;
      }
    }).filter((field) => field !== null));

    return attributes;
  }
}

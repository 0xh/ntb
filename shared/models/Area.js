import BaseModel from './BaseModel';
import DocumentStatusSchema from './schemas/document-status';


export default class Area extends BaseModel {
  static tableName = 'areas';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];


  get uri() {
    return `area/${this.id}`;
  }


  static relationMappings = {
    children: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Area',
      join: {
        from: 'areas.id',
        through: {
          modelClass: 'AreaToArea',
          from: 'areasToAreas.parentId',
          to: 'areasToAreas.childId',
        },
        to: 'areas.id',
      },
    },
    parents: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Area',
      join: {
        from: 'areas.id',
        through: {
          modelClass: 'AreaToArea',
          from: 'areasToAreas.childId',
          to: 'areasToAreas.parentId',
        },
        to: 'areas.id',
      },
    },
    counties: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'County',
      join: {
        from: 'areas.id',
        through: {
          modelClass: 'AreaToCounty',
          from: 'areasToCounties.areaId',
          to: 'areasToCounties.countyId',
        },
        to: 'counties.id',
      },
    },
    municipalities: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Municipality',
      join: {
        from: 'areas.id',
        through: {
          modelClass: 'AreaToMunicipality',
          from: 'areasToMunicipalities.areaId',
          to: 'areasToMunicipalities.municipalityId',
        },
        to: 'municipalities.id',
      },
    },
    cabins: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'areas.id',
        through: {
          modelClass: 'CabinToArea',
          from: 'cabinsToAreas.areaId',
          to: 'cabinsToAreas.cabinId',
        },
        to: 'cabins.id',
      },
    },
    pois: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'areas.id',
        through: {
          modelClass: 'PoiToArea',
          from: 'poisToAreas.areaId',
          to: 'poisToAreas.poiId',
        },
        to: 'pois.id',
      },
    },
    pictures: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'Picture',
      join: {
        from: 'areas.id',
        to: 'pictures.areaId',
      },
    },
  };


  static geometryAttributes = [
    'geometry',
  ];


  static jsonSchema = {
    type: 'object',
    required: [
      'name',
      'provider',
      'status',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { format: 'uuid', readOnly: true },
      idLegacyNtb: { type: 'string', readOnly: true },
      name: { type: 'string', minLength: 2, maxLength: 100 },
      description: { type: 'string', maxLength: 100000 },
      geometry: { type: 'object' },
      map: { type: 'string', maxLength: 300 },
      url: { type: 'string', maxLength: 300 },
      license: { type: 'string', maxLength: 300 },
      provider: { type: 'string', maxLength: 300, readOnly: true },
      status: { ...DocumentStatusSchema },
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
      validFilters: {
        id: {},
        idLegacyNtb: {},
        name: {},
        provider: {},
        status: {},
      },
      fullFields: [
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
      defaultFields: [
        '*full',
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
    const extra = {};

    const attributes = super.getAPIFieldsToAttributes(referrer, fields, extra);

    return attributes;
  }
}

import BaseModel from './BaseModel';
import DocumentStatusSchema from './schemas/document-status';


export default class Poi extends BaseModel {
  static tableName = 'pois';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];


  get uri() {
    return `poi/${this.id}`;
  }


  static relationMappings = {
    // TODO(roar):
    // lists

    poiTypes: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'PoiType',
      join: {
        from: 'pois.id',
        through: {
          modelClass: 'PoiToPoiType',
          from: 'poisToPoiTypes.poiId',
          extra: { primaryPoiType: 'primary' },
          to: 'poisToPoiTypes.poiType',
        },
        to: 'poiTypes.name',
      },
    },
    links: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'PoiLink',
      join: {
        from: 'pois.id',
        to: 'poiLinks.poiId',
      },
    },
    accessabilities: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Accessability',
      join: {
        from: 'pois.id',
        through: {
          modelClass: 'PoiAccessability',
          extra: { poiAccessabilityDescription: 'description' },
          from: 'poiAccessabilities.poiId',
          to: 'poiAccessabilities.accessabilityName',
        },
        to: 'accessabilities.name',
      },
    },
    pictures: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'Picture',
      join: {
        from: 'pois.id',
        to: 'pictures.poiId',
      },
    },
    areas: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Area',
      join: {
        from: 'pois.id',
        through: {
          modelClass: 'PoiToArea',
          from: 'poisToAreas.poiId',
          to: 'poisToAreas.areaId',
        },
        to: 'areas.id',
      },
    },
    groups: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Group',
      join: {
        from: 'pois.id',
        through: {
          modelClass: 'PoiToGroup',
          from: 'poisToGroups.poiId',
          to: 'poisToGroups.groupId',
        },
        to: 'groups.id',
      },
    },
    county: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: 'County',
      join: {
        from: 'pois.countyId',
        to: 'counties.id',
      },
    },
    municipality: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: 'Municipality',
      join: {
        from: 'pois.municipalityId',
        to: 'municipalities.id',
      },
    },
    routes: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'pois.id',
        through: {
          modelClass: 'RouteToPoi',
          from: 'routesToPois.poiId',
          to: 'routesToPois.routeId',
        },
        to: 'routes.id',
      },
    },
    trips: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'pois.id',
        through: {
          modelClass: 'TripToPoi',
          from: 'tripsToPois.poiId',
          to: 'tripsToPois.routeId',
        },
        to: 'trips.id',
      },
    },
  };


  static geometryAttributes = [
    'coordinates',
  ];


  static jsonSchema = {
    type: 'object',
    required: [
      'name',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { type: 'string', format: 'uuid', readOnly: true },
      idLegacyNtb: { type: 'string', readOnly: true, noApiReturn: true },
      idSsr: { type: 'string', maxLength: 100 },
      type: { type: 'string', maxLength: 100 },
      name: { type: 'string', minLength: 2, maxLength: 100 },
      description: { type: 'string', maxLength: 100000 },
      coordinates: { type: 'object' },
      season: {
        type: 'array',
        items: [
          {
            type: 'number',
          },
        ],
      },
      open: { type: 'boolean' },
      license: { type: 'string', maxLength: 300 },
      provider: { type: 'string', maxLength: 300, readOnly: true },
      status: { ...DocumentStatusSchema },
      updatedAt: { type: 'string', format: 'date', readOnly: true },
      createdAt: { type: 'string', format: 'date', readOnly: true },
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
        idLegacyNtb: { filterTypes: ['=', 'null', 'notnull', '$in', '$nin'] },
        idSsr: { filterTypes: ['=', 'null', 'notnull', '$in', '$nin'] },
        type: { filterTypes: ['=', 'null', 'notnull', '$in', '$nin'] },
        name: {},
        coordinates: {
          geojsonType: 'point',
        },
        provider: { filterTypes: ['=', '$in', '$nin'] },
        status: { filterTypes: ['=', '$in', '$nin'] },
        updatedAt: {},
        createdAt: {},
      },
      fullFields: [
        'uri',
        'id',
        'idSsr',
        'type',
        'name',
        'description',
        'coordinates',
        'season',
        'open',
        'license',
        'provider',
        'status',
        'updatedAt',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [
        'accessabilities',
        'poiTypes',
      ],
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

    // Configuration when included through Accessability.pois
    config['Accessability.pois'] = {
      ...config.default,
      defaultFields: [
        ...config.default.defaultFields,
        'poiAccessabilityDescription',
      ],
    };

    // Configuration when included through PoiType.pois
    config['PoiType.pois'] = {
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
      // Related extra field from Accessability
      poiAccessabilityDescription: ['poiAccessabilityDescription'],
      // Related extra field from PoiType
      primaryPoiType: ['primaryPoiType'],
    };

    const attributes = super.getAPIFieldsToAttributes(referrer, fields, extra);

    return attributes;
  }
}

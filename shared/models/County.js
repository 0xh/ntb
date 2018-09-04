import BaseModel from './BaseModel';
import DocumentStatusSchema from './schemas/document-status';


export default class County extends BaseModel {
  static tableName = 'counties';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];


  get uri() {
    return `county/${this.id}`;
  }


  static relationMappings = {
    areas: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Area',
      join: {
        from: 'counties.id',
        through: {
          modelClass: 'AreaToCounty',
          from: 'areasToCounties.countyId',
          to: 'areasToCounties.areaId',
        },
        to: 'areas.id',
      },
    },
    hazardRegions: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'HazardRegion',
      join: {
        from: 'counties.id',
        through: {
          modelClass: 'CountyToHazardRegion',
          from: 'countiesToHazardRegions.countyId',
          to: 'countiesToHazardRegions.hazardRegionId',
        },
        to: 'hazardRegions.id',
      },
    },
    routes: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'counties.id',
        through: {
          modelClass: 'RouteToCounty',
          from: 'routesToCounties.countyId',
          to: 'routesToCounties.routeId',
        },
        to: 'routes.id',
      },
    },
    trips: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'counties.id',
        through: {
          modelClass: 'TripToCounty',
          from: 'tripsToCounties.countyId',
          to: 'tripsToCounties.tripId',
        },
        to: 'trips.id',
      },
    },
  };

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
      code: { type: 'string' },
      name: { type: 'string', minLength: 2, maxLength: 100 },
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
      fullTextSearch: false,
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
        code: {},
        name: {},
        status: { filterTypes: ['=', '$in', '$nin'] },
        updatedAt: {},
        createdAt: {},
      },
      fullFields: [
        'uri',
        'id',
        'code',
        'name',
        'status',
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

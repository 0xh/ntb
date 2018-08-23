import BaseModel from './BaseModel';


export default class HazardRegion extends BaseModel {
  static tableName = 'hazardRegions';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];


  get uri() {
    return `hazard_region/${this.id}`;
  }


  static relationMappings = {
    cabins: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'hazardRegions.id',
        through: {
          modelClass: 'CabinToHazardRegion',
          from: 'cabinsToHazardRegions.hazardRegionId',
          to: 'cabinsToHazardRegions.cabinId',
        },
        to: 'cabins.id',
      },
    },
    routes: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'hazardRegions.id',
        through: {
          modelClass: 'RouteToHazardRegion',
          from: 'routesToHazardRegions.hazardRegionId',
          to: 'routesToHazardRegions.routeId',
        },
        to: 'routes.id',
      },
    },
    routeSegments: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'RouteSegment',
      join: {
        from: 'hazardRegions.id',
        through: {
          modelClass: 'RouteSegmentToHazardRegion',
          from: 'routeSegmentsToHazardRegions.hazardRegionId',
          to: 'routeSegmentsToHazardRegions.routeSegmentId',
        },
        to: 'routeSegments.id',
      },
    },
    trips: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'hazardRegions.id',
        through: {
          modelClass: 'TripToHazardRegion',
          from: 'tripsToHazardRegions.hazardRegionId',
          to: 'tripsToHazardRegions.tripId',
        },
        to: 'trips.id',
      },
    },
    pois: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'hazardRegions.id',
        through: {
          modelClass: 'PoiToHazardRegion',
          from: 'poisToHazardRegions.hazardRegionId',
          to: 'poisToHazardRegions.poiId',
        },
        to: 'pois.id',
      },
    },
    // poi
  };


  static geometryAttributes = [
    'geometry',
  ];


  static jsonSchema = {
    type: 'object',
    required: [
      'name',
      'geometry',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { format: 'uuid', readOnly: true },
      type: { type: 'string' },
      name: { type: 'string', minLength: 2, maxLength: 100 },
      regionId: { type: 'number' },
      regionTypeId: { type: 'number' },
      regionType: { type: 'string' },
      geometry: { type: 'object' },
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
        'region_id',
        'updatedAt',
        'createdAt',
      ],
      defaultOrder: [['region_id', 'ASC']],
      validFilters: {
        id: {},
        type: { filterTypes: ['=', '$in', '$nin'] },
        regionId: { filterTypes: ['=', '$in', '$nin'] },
      },
      fullFields: [
        'uri',
        'id',
        'type',
        'name',
        'regionId',
        'regionTypeId',
        'regionType',
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
      paginate: false,
      defaultFields: [
        'uri',
        'id',
        'type',
        'name',
        'regionId',
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

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
    areas: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Area',
      join: {
        from: 'hazardRegions.id',
        through: {
          modelClass: 'AreaToHazardRegion',
          from: 'areasToHazardRegions.hazardRegionId',
          to: 'areasToHazardRegions.areaId',
        },
        to: 'areas.id',
      },
    },
    counties: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'County',
      join: {
        from: 'hazardRegions.id',
        through: {
          modelClass: 'CountyToHazardRegion',
          from: 'countiesToHazardRegions.hazardRegionId',
          to: 'countiesToHazardRegions.countyId',
        },
        to: 'counties.id',
      },
    },
    municipalities: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Municipality',
      join: {
        from: 'hazardRegions.id',
        through: {
          modelClass: 'MunicipalityToHazardRegion',
          from: 'municipalitiesToHazardRegions.hazardRegionId',
          to: 'municipalitiesToHazardRegions.municipalityId',
        },
        to: 'municipalities.id',
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
      'geometry',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { type: 'string', format: 'uuid', readOnly: true },
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
      fullTextSearch: false,
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

import BaseModel from './BaseModel';
import DocumentStatusSchema from './schemas/document-status';


export default class Route extends BaseModel {
  static tableName = 'routes';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];

  get uri() {
    return `route/${this.id}`;
  }

  static relationMappings = {
    routeSegments: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'RouteSegment',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToRouteSegment',
          from: 'routesToRouteSegments.routeId',
          to: 'routesToRouteSegments.routeSegmentId',
        },
        to: 'routeSegments.id',
      },
    },
    activityTypes: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'ActivityType',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToActivityType',
          from: 'routesToActivityTypes.routeId',
          to: 'routesToActivityTypes.activityTypeName',
        },
        to: 'activityTypes.name',
      },
    },
    routeWaymarkTypes: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'RouteWaymarkType',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToRouteWaymarkType',
          from: 'routesToRouteWaymarkTypes.routeId',
          to: 'routesToRouteWaymarkTypes.routeWaymarkTypeName',
        },
        to: 'routeWaymarkTypes.name',
      },
    },
    counties: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'County',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToCounty',
          from: 'routesToCounties.routeId',
          to: 'routesToCounties.countyId',
        },
        to: 'counties.id',
      },
    },
    groups: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Group',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToGroup',
          from: 'routesToGroups.routeId',
          to: 'routesToGroups.groupId',
        },
        to: 'groups.id',
      },
    },
    pois: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToPoi',
          from: 'routesToPois.routeId',
          to: 'routesToPois.poiId',
        },
        to: 'pois.id',
      },
    },
    links: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'RouteLink',
      join: {
        from: 'routes.id',
        to: 'routeLinks.routeId',
      },
    },
    pictures: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'Picture',
      join: {
        from: 'routes.id',
        to: 'pictures.routeId',
      },
    },
    hazardRegions: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'HazardRegion',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToHazardRegion',
          from: 'routesToHazardRegions.routeId',
          to: 'routesToHazardRegions.hazardRegionId',
        },
        to: 'hazardRegions.id',
      },
    },
  };


  static geometryAttributes = [];


  static jsonSchema = {
    type: 'object',
    required: [
      'code',
      'isWinter',
      'name',
      'suitableForChildren',
      'waymarkWinterAllYear',
      'provider',
      'status',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { type: 'string', format: 'uuid', readOnly: true },
      idLegacyNtbAb: { type: 'string', readOnly: true, noApiReturn: true },
      idLegacyNtbBa: { type: 'string', readOnly: true, noApiReturn: true },
      code: { type: 'string' },
      type: { type: 'string' },
      name: { type: 'string', minLength: 2, maxLength: 100 },
      description: { type: 'string', maxLength: 100000 },
      descriptionAb: { type: 'string', maxLength: 100000 },
      descriptionBa: { type: 'string', maxLength: 100000 },
      url: { type: 'string', maxLength: 100 },
      source: { type: 'string', maxLength: 100 },
      notes: { type: 'string', maxLength: 100 },
      grading: { type: 'string', maxLength: 100 },
      suitableForChildren: { type: 'boolean', default: false },
      distance: { type: 'number' },
      calculatedDistance: { type: 'number' },
      waymarkWinter: {
        type: 'object',
        properties: {
          allYear: { type: 'boolean', deafult: false },
          from: { type: 'string', format: 'date' },
          to: { type: 'string', format: 'date' },
          comment: { type: 'string', maxLength: 100 },
        },
      },
      duration: {
        type: 'object',
        properties: {
          minutes: { type: 'number' },
          hours: { type: 'number' },
          days: { type: 'number' },
        },
      },
      season: {
        type: 'array',
        items: [
          {
            type: 'number',
          },
        ],
      },
      license: { type: 'string', maxLength: 300 },
      provider: { type: 'string', maxLength: 300, readOnly: true },
      status: { ...DocumentStatusSchema },
      updatedAt: { type: 'string', format: 'date', readOnly: true },
      createdAt: { type: 'string', format: 'date', readOnly: true },
    },
  };


  $parseDatabaseJson(databaseJson) {
    const json = super.$parseDatabaseJson(databaseJson);

    // Create waymarkWinter object
    json.waymarkWinter = {
      allYear: databaseJson.waymarkWinterAllYear,
      from: databaseJson.waymarkWinterFrom,
      to: databaseJson.waymarkWinterTo,
      comment: databaseJson.waymarkWinterComment,
    };

    // Remove from databaseJson
    delete json.waymarkWinterAllYear;
    delete json.waymarkWinterFrom;
    delete json.waymarkWinterTo;
    delete json.waymarkWinterComment;

    // Create duration object
    json.duration = {
      minutes: databaseJson.durationMinutes,
      hours: databaseJson.durationHours,
      days: databaseJson.durationDays,
    };

    // Remove from databaseJson
    delete json.durationMinutes;
    delete json.durationHours;
    delete json.durationDays;

    return json;
  }


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
        type: { filterTypes: ['=', '$in', '$nin'] },
        idLegacyNtbAb: {
          filterTypes: ['=', 'null', 'notnull', '$in', '$nin'],
        },
        idLegacyNtbBa: {
          filterTypes: ['=', 'null', 'notnull', '$in', '$nin'],
        },
        isWinter: {},
        name: {},
        source: { filterTypes: ['=', 'null', 'notnull', '$in', '$nin'] },
        grading: { filterTypes: ['=', 'null', 'notnull', '$in', '$nin'] },
        suitableForChildren: {},
        distance: {},
        pointA: {
          geojsonType: 'point',
        },
        pointB: {
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
        'code',
        'isWinter',
        'name',
        'description',
        'descriptionAb',
        'descriptionBa',
        'url',
        'notes',
        'grading',
        'suitableForChildren',
        'distance',
        'calculatedDistance',
        'duration',
        'waymarkWinter',
        'season',
        'license',
        'provider',
        'status',
        'updatedAt',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [
        'ownerGroup',
        'contactGroup',
        'maintainerGroup',
        'activityTypes',
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

    return config;
  }


  static getAPIFieldsToAttributes(referrer, fields) {
    const extra = {
      // Related extra field from Accessability
      cabinAccessabilityDescription: ['cabinAccessabilityDescription'],
      waymarkWinter: [
        'waymarkWinterAllYear',
        'waymarkWinterFrom',
        'waymarkWinterTo',
        'waymarkWinterComment',
      ],
      duration: [
        'durationMinutes',
        'durationHours',
        'durationDays',
      ],
    };

    const attributes = super.getAPIFieldsToAttributes(referrer, fields, extra);

    return attributes;
  }
}

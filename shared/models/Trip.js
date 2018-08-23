import BaseModel from './BaseModel';
import DocumentStatusSchema from './schemas/document-status';


export default class Trip extends BaseModel {
  static tableName = 'trips';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];


  get uri() {
    return `trip/${this.id}`;
  }


  static relationMappings = {
    subActivityTypes: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'ActivityType',
      join: {
        from: 'trips.id',
        through: {
          modelClass: 'TripToActivityType',
          extra: { primaryActivityType: 'primary' },
          from: 'tripsToActivityTypes.tripId',
          to: 'tripsToActivityTypes.activityTypeName',
        },
        to: 'activityTypes.name',
      },
    },
    groups: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Group',
      join: {
        from: 'trips.id',
        through: {
          modelClass: 'TripToGroup',
          from: 'tripsToGroups.tripId',
          to: 'tripsToGroups.groupId',
        },
        to: 'groups.id',
      },
    },
    pois: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'trips.id',
        through: {
          modelClass: 'TripToPoi',
          from: 'tripsToPois.tripId',
          to: 'tripsToPois.poiId',
        },
        to: 'pois.id',
      },
    },
    links: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'TripLink',
      join: {
        from: 'trips.id',
        to: 'tripLinks.tripId',
      },
    },
    pictures: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'Picture',
      join: {
        from: 'trips.id',
        to: 'pictures.tripId',
      },
    },
    hazardRegions: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'HazardRegion',
      join: {
        from: 'trips.id',
        through: {
          modelClass: 'TripToHazardRegion',
          from: 'tripsToHazardRegions.tripId',
          to: 'tripsToHazardRegions.hazardRegionId',
        },
        to: 'hazardRegions.id',
      },
    },
  };


  static jsonSchema = {
    type: 'object',
    required: [
      'name',
      'suitableForChildren',
      'provider',
      'status',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { type: 'string', format: 'uuid', readOnly: true },
      idLegacyNtb: { type: 'string', readOnly: true, noApiReturn: true },
      activityType: { type: 'string', maxLength: 100 },
      name: { type: 'string', minLength: 2, maxLength: 100 },
      description: { type: 'string', maxLength: 100000 },
      url: { type: 'string', maxLength: 100 },
      grading: { type: 'string', maxLength: 100 },
      suitableForChildren: { type: 'boolean', default: false },
      distance: { type: 'number' },
      direction: { type: 'string', maxLength: 2, minLength: 2 },
      duration: {
        type: 'object',
        properties: {
          minutes: { type: 'number' },
          hours: { type: 'number' },
          days: { type: 'number' },
        },
      },
      starting_point: { type: 'object' },
      path: { type: 'object' },
      pathPolyline: { type: 'string' },
      season: {
        type: 'array',
        items: [
          {
            type: 'number',
          },
        ],
      },
      htgt: {
        type: 'object',
        properties: {
          general: { type: 'string', maxLength: 1000 },
          winter: { type: 'string', format: 'email', maxLength: 1000 },
          summer: { type: 'string', maxLength: 1000 },
          publicTransport: { type: 'string', maxLength: 1000 },
          publicTransportAvailable: { type: 'boolean' },
          carAllYear: { type: 'boolean' },
          boatTransportAvailable: { type: 'boolean' },
          carSummer: { type: 'boolean' },
          bicycle: { type: 'boolean' },
        },
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

    // Create htgt object
    json.htgt = {
      general: databaseJson.htgtGeneral,
      winter: databaseJson.htgtWinter,
      summer: databaseJson.htgtSummer,
      publicTransport: databaseJson.htgtPublicTransport,
      publicTransportAvailable: databaseJson.htgtPublicTransportAvailable,
      carAllYear: databaseJson.htgtCarAllYear,
      boatTransportAvailable: databaseJson.htgtBoatTransportAvailable,
      carSummer: databaseJson.htgtCarSummer,
      bicycle: databaseJson.htgtBicycle,
    };

    // Remove from databaseJson
    delete json.general;
    delete json.winter;
    delete json.summer;
    delete json.publicTransport;
    delete json.publicTransportAvailable;
    delete json.carAllYear;
    delete json.boatTransportAvailable;
    delete json.carSummer;
    delete json.bicycle;

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
        idLegacyNtb: { filterTypes: ['=', 'null', 'notnull', '$in', '$nin'] },
        activityType: { filterTypes: ['=', 'null', 'notnull', '$in', '$nin'] },
        name: {},
        suitableForChildren: {},
        provider: { filterTypes: ['=', '$in', '$nin'] },
        distance: {},
        direction: { filterTypes: ['=', 'null', 'notnull'] },
        status: { filterTypes: ['=', '$in', '$nin'] },
        updatedAt: {},
        createdAt: {},
      },
      fullFields: [
        'uri',
        'id',
        'name',
        'description',
        'url',
        'grading',
        'suitableForChildren',
        'distance',
        'direction',
        'duration',
        'season',
        'htgt',
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
      duration: [
        'durationMinutes',
        'durationHours',
        'durationDays',
      ],
      htgt: [
        'htgtGeneral',
        'htgtWinter',
        'htgtSummer',
        'htgtPublicTransport',
        'htgtPublicTransportAvailable',
        'htgtCarAllYear',
        'htgtBoatTransportAvailable',
        'htgtCarSummer',
        'htgtBicycle',
      ],
    };

    const attributes = super.getAPIFieldsToAttributes(referrer, fields, extra);

    return attributes;
  }
}

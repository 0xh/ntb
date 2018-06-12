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
    // TODO(Roar)
    // activity_type
    // links
    // waymark_types
    // counties
    // Municipalities
    // groups
    // pois

    // areas: {
    //   relation: BaseModel.ManyToManyRelation,
    //   modelClass: 'Area',
    //   join: {
    //     from: 'cabins.id',
    //     through: {
    //       modelClass: 'CabinToArea',
    //       from: 'cabinsToAreas.cabinId',
    //       to: 'cabinsToAreas.areaId',
    //     },
    //     to: 'areas.id',
    //   },
    // },
    pictures: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'Picture',
      join: {
        from: 'routes.id',
        to: 'pictures.routeId',
      },
    },
  };


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
      isWinter: { type: 'boolean', default: false },
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
      pointA: { type: 'object' },
      pointB: { type: 'object' },
      pathAb: { type: 'object' },
      pathBa: { type: 'object' },
      pathAbPolyline: { type: 'string' },
      pathBaPolyline: { type: 'string' },
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
        idLegacyNtbAb: {},
        idLegacyNtbBa: {},
        isWinter: {},
        name: {},
        source: {},
        grading: {},
        suitableForChildren: {},
        distance: {},
        pointA: {
          geojsonType: 'point',
        },
        pointB: {
          geojsonType: 'point',
        },
        provider: {},
        status: {},
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

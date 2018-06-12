import BaseModel from './BaseModel';
import DocumentStatusSchema from './schemas/document-status';


export default class Picture extends BaseModel {
  static tableName = 'pictures';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];


  get uri() {
    return `picture/${this.id}`;
  }


  static relationMappings = {
    // TODO
    // list

    area: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: 'Area',
      join: {
        from: 'pictures.areaId',
        to: 'areas.id',
      },
    },
    cabin: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: 'Cabin',
      join: {
        from: 'pictures.cabinId',
        to: 'cabins.id',
      },
    },
    poi: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: 'Poi',
      join: {
        from: 'pictures.poiId',
        to: 'pois.id',
      },
    },
    route: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: 'Route',
      join: {
        from: 'pictures.routeId',
        to: 'routes.id',
      },
    },
    trip: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: 'Trip',
      join: {
        from: 'pictures.tripId',
        to: 'trips.id',
      },
    },
  };

  static jsonSchema = {
    type: 'object',
    required: [
      'provider',
      'status',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { format: 'uuid', readOnly: true },
      idLegacyNtb: { type: 'string', readOnly: true },
      cabinPictureType: { type: 'string' },
      photographer: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          credit: { type: 'string' },
        },
      },
      description: { type: 'string' },
      coordinates: { type: 'object' },
      original: { type: 'object' },
      exif: { type: 'object' },
      versions: { type: 'object' },
      license: { type: 'string', maxLength: 300 },
      provider: { type: 'string', maxLength: 300, readOnly: true },
      status: { ...DocumentStatusSchema },
      updatedAt: { format: 'date', readOnly: true },
      createdAt: { format: 'date', readOnly: true },
    },
  };


  $parseDatabaseJson(databaseJson) {
    const json = super.$parseDatabaseJson(databaseJson);

    // Create photographer object
    json.photographer = {
      name: databaseJson.photographerName,
      email: databaseJson.photographerEmail,
      credit: databaseJson.photographerCredit,
    };

    // Remove from databaseJson
    delete json.photographerName;
    delete json.photographerEmail;
    delete json.photographerCredit;

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
        'sortIndex',
        'updatedAt',
        'createdAt',
      ],
      defaultOrder: [['updatedAt', 'DESC']],
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
        'cabinPictureType',
        'photographer',
        'description',
        'coordinates',
        'original',
        'exif',
        'versions',
        'license',
        'provider',
        'status',
        'updatedAt',
      ],
      defaultFields: [
        'uri',
        'id',
        'cabinPictureType',
        'photographer',
        'description',
        'coordinates',
        'versions',
        'license',
        'provider',
        'status',
        'updatedAt',
      ],
      defaultRelations: [],
    };

    // Default configuration when included from another model
    config['*single'] = {
      ...config['*list'],
      defaultRelations: [
        'area',
        'cabin',
        'poi',
        'trip',
        'route',
      ],
    };

    // Default configuration when included from another model
    config.default = {
      ...config['*list'],
      defaultOrder: [['sortIndex', 'ASC']],
      defaultFields: [
        'uri',
        'id',
        'versions',
        'description',
        'photographer',
      ],

      defaultRelations: [],
    };

    return config;
  }


  static getAPIFieldsToAttributes(referrer, fields) {
    const extra = {
      photographer: [
        'photographerName',
        'photographerEmail',
        'photographerCredit',
      ],
    };

    const attributes = super.getAPIFieldsToAttributes(referrer, fields, extra);

    return attributes;
  }
}

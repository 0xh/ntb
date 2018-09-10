import BaseModel from './BaseModel';
import DocumentStatusSchema from './schemas/document-status';


export default class Group extends BaseModel {
  static tableName = 'groups';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];


  get uri() {
    return `group/${this.id}`;
  }


  static relationMappings = {
    // TODO(Roar):
    // lists

    ownsCabins: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'groups.id',
        to: 'cabins.ownerGroupId',
      },
    },
    isContactForCabins: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'groups.id',
        to: 'cabins.contactGroupId',
      },
    },
    maintainesCabins: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'groups.id',
        to: 'cabins.maintainerGroupId',
      },
    },
    municipality: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: 'Municipality',
      join: {
        from: 'groups.municipality_id',
        to: 'municipalities.id',
      },
    },
    pois: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'groups.id',
        through: {
          modelClass: 'PoiToGroup',
          from: 'poisToGroups.groupId',
          to: 'poisToGroups.poiId',
        },
        to: 'pois.id',
      },
    },
    links: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'GroupLink',
      join: {
        from: 'groups.id',
        to: 'groupLinks.groupId',
      },
    },
    trips: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'groups.id',
        through: {
          modelClass: 'TripToGroup',
          from: 'tripsToGroups.groupId',
          to: 'tripsToGroups.tripId',
        },
        to: 'trips.id',
      },
    },
    routes: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'groups.id',
        through: {
          modelClass: 'RouteToGroup',
          from: 'routesToGroups.groupId',
          to: 'routesToGroups.routeId',
        },
        to: 'routes.id',
      },
    },
  };


  static jsonSchema = {
    type: 'object',
    required: [
      'name',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { type: 'string', format: 'uuid' },
      idLegacyNtb: { type: 'string', readOnly: true, noApiReturn: true },
      groupType: { type: 'string' },
      groupSubType: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      logo: { type: 'string' },
      organizationNumber: { type: 'string' },
      url: { type: 'string' },
      email: { type: 'string' },
      phone: { type: 'string' },
      mobile: { type: 'string' },
      fax: { type: 'string' },
      address1: { type: 'string' },
      address2: { type: 'string' },
      postalCode: { type: 'string' },
      postalName: { type: 'string' },
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
      defaultOrder: [['name', 'ASC']],
      validOrderFields: [
        'name',
        'updatedAt',
        'createdAt',
      ],
      fullFields: [
        'uri',
        'id',
        'type',
        'subType',
        'name',
        'description',
        'logo',
        'organizationNumber',
        'url',
        'email',
        'phone',
        'mobile',
        'fax',
        'address1',
        'address2',
        'postalCode',
        'postalName',
        'license',
        'provider',
        'status',
        'updatedAt',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [
        'links',
      ],
      validFilters: {
        id: {},
        idLegacyNtb: { filterTypes: ['=', 'null', 'notnull', '$in', '$nin'] },
        groupType: {},
        groupSubType: {},
        name: {},
        provider: { filterTypes: ['=', '$in', '$nin'] },
        status: { filterTypes: ['=', '$in', '$nin'] },
        updatedAt: {},
        createdAt: {},
      },
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
    const extra = {};

    const attributes = super.getAPIFieldsToAttributes(referrer, fields, extra);

    return attributes;
  }
}

import BaseModel from './BaseModel';


export default class Group extends BaseModel {
  static tableName = 'groups';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];


  get uri() {
    return `group/${this.id}`;
  }


  static relationMappings = {
    // TODO(Roar):
    // municipality
    // poi
    // pois
    // lists
    // links
    // // cabins - owner
    // cabins - maintainer
    // cabins - contact

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
      status: { $ref: 'DocumentStatus' },
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
      defaultFields: [
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
      defaultRelations: [],
      validFilters: {
        id: {},
        groupType: {},
        groupSubType: {},
        name: {},
        provider: {},
        status: {},
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
    };

    return config;
  }


  static getAPIFieldsToAttributes(referrer, fields) {
    const extra = {};

    const attributes = super.getAPIFieldsToAttributes(referrer, fields, extra);

    return attributes;
  }
}

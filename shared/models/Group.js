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
      uri: { type: 'text', readOnly: true },
      id: { type: 'text', format: 'uuid' },
      idLegacyNtb: { type: 'text', readOnly: true, noApiReturn: true },
      groupType: { type: 'text' },
      groupSubType: { type: 'text' },
      name: { type: 'text' },
      description: { type: 'text' },
      logo: { type: 'text' },
      organizationNumber: { type: 'text' },
      url: { type: 'text' },
      email: { type: 'text' },
      phone: { type: 'text' },
      mobile: { type: 'text' },
      fax: { type: 'text' },
      address1: { type: 'text' },
      address2: { type: 'text' },
      postalCode: { type: 'text' },
      postalName: { type: 'text' },
      license: { type: 'text', maxLength: 300 },
      provider: { type: 'text', maxLength: 300, readOnly: true },
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

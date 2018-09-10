import BaseModel from './BaseModel';


export default class GroupType extends BaseModel {
  static tableName = 'groupTypes';
  static idColumn = 'name';
  static virtualAttributes = ['uri'];


  get uri() {
    return `group_type/${this.name}`;
  }


  static relationMappings = {
    parentGroupType: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: 'GroupType',
      join: {
        from: 'groupTypes.parent',
        to: 'groupTypes.name',
      },
    },
    groupsWithMainType: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'Group',
      join: {
        from: 'groupTypes.name',
        to: 'groups.groupType',
      },
    },
    groupsWithSubType: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'Group',
      join: {
        from: 'groupTypes.name',
        to: 'groups.groupSubType',
      },
    },
  };


  static jsonSchema = {
    type: 'object',
    required: [
      'name',
    ],

    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
    },
  };


  static APIEntryModel = true;

  static getAPIConfig() {
    const config = {};

    // Configuration when it's the entry model
    config['*list'] = {
      paginate: false,
      fullTextSearch: false,
      ordering: true,

      defaultOrder: [['name', 'ASC']],
      validOrderFields: ['name'],
      validFilters: {
        name: { filterTypes: ['=', '$in', '$nin'] },
      },
      fullFields: [
        'uri',
        'name',
        'parent',
        'description',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [
        'parentGroupType',
      ],
    };

    // Default configuration when an instance in accessed directly
    config['*single'] = config['*list'];

    // Default configuration when included from another model
    config.default = {
      ...config['*list'],
      defaultFields: [
        'uri',
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

import BaseModel from './BaseModel';


export default class GroupLink extends BaseModel {
  static tableName = 'groupLinks';
  static idColumn = 'id';
  static virtualAttributes = [];


  static relationMappings = {};


  static jsonSchema = {
    type: 'object',
    required: [
      'type',
      'url',
    ],

    properties: {
      type: { type: 'string' },
      title: { type: 'string' },
      url: { type: 'string' },
    },
  };


  static getAPIConfig() {
    const config = {};

    // Configuration when it's the entry model
    config.default = {
      paginate: false,
      fullTextSearch: false,
      ordering: true,

      defaultOrder: [['sortIndex', 'ASC']],
      validOrderFields: [
        'sortIndex',
        'title',
      ],
      validFilters: {},
      fullFields: [
        'type',
        'title',
        'url',
      ],
      defaultFields: [
        '*full',
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

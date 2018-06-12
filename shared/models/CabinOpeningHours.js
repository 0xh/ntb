import BaseModel from './BaseModel';


export default class CabinOpeningHours extends BaseModel {
  static tableName = 'cabinOpeningHours';
  static idColumn = 'id';
  static virtualAttributes = [];


  static relationMappings = {};


  static jsonSchema = {
    type: 'object',
    required: [
      'allYear',
    ],

    properties: {
      allYear: { type: 'boolean', default: false },
      from: { type: 'string', format: 'date' },
      to: { type: 'string', format: 'date' },
      serviceLevel: { type: 'string' },
      key: { type: 'string' },
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
        'from',
        'to',
        'allYear',
      ],
      validFilters: {
        allYear: {},
        from: {},
        to: {},
        serviceLevel: {},
      },
      fullFields: [
        'allYear',
        'from',
        'to',
        'serviceLevel',
        'key',
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

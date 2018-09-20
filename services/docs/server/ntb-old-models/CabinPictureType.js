import BaseModel from './BaseModel';


export default class CabinPictureType extends BaseModel {
  static tableName = 'cabinPictureTypes';
  static idColumn = 'name';
  static virtualAttributes = [];


  static relationMappings = {};


  static jsonSchema = {
    type: 'object',
    required: [
      'name',
    ],

    properties: {
      name: { type: 'string' },
    },
  };


  static APIEntryModel = true;

  static getAPIConfig() {
    const config = {};

    // Default configuration
    config.default = {
      paginate: false,
      fullTextSearch: false,
      ordering: true,

      defaultOrder: [['name', 'ASC']],
      validOrderFields: ['name'],
      validFilters: {},
      fullFields: [
        'name',
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

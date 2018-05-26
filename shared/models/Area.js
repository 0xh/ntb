import _ from 'lodash';

import BaseModel from './BaseModel';


export default class Area extends BaseModel {
  static tableName = 'areas';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];


  get uri() {
    return `area/${this.id}`;
  }


  static relationMappings = {
    documentStatus: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: 'DocumentStatus',
      join: {
        from: 'areas.status',
        to: 'documentStatuses.name',
      },
    },
    children: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Area',
      join: {
        from: 'areas.id',
        through: {
          modelClass: 'AreaToArea',
          extra: { a2aCreatedAt: 'createdAt' },
          from: 'areasToAreas.parentId',
          to: 'areasToAreas.childId',
        },
        to: 'areas.id',
      },
    },
    parents: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Area',
      join: {
        from: 'areas.id',
        through: {
          modelClass: 'AreaToArea',
          from: 'areasToAreas.childId',
          to: 'areasToAreas.parentId',
        },
        to: 'areas.id',
      },
    },
  };

  static jsonSchema = {
    type: 'object',
    required: [
      'name',
      'provider',
      'status',
    ],

    properties: {
      uri: { type: 'text', readOnly: true },
      id: { format: 'uuid', readOnly: true },
      idLegacyNtb: { type: 'text', readOnly: true },
      name: { type: 'text', minLength: 2, maxLength: 100 },
      description: { type: 'text', maxLength: 100000 },
      a2aCreatedAt: {
        format: 'date',
        readOnly: true,
        availableForReferrers: [
          'Area.children',
        ],
      },
      geometry: { $ref: 'GeojsonPolygon' },
      map: { type: 'text', maxLength: 300 },
      url: { type: 'text', maxLength: 300 },
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
      validOrderFields: [
        'name',
        'updatedAt',
        'createdAt',
      ],
      defaultOrder: [['name', 'ASC']],
      defaultFields: [
        'uri',
        'id',
        'name',
        'description',
        'map',
        'url',
        'license',
        'provider',
        'status',
        'updatedAt',
      ],
      defaultRelations: [
        'parents',
        'children',
      ],
    };

    // Default configuration when included from another model
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
    const attrs = this.getBaseFields(referrer);
    const attributes = [].concat(...fields.map((field) => {
      switch (field) {
        case 'uri':
          return null;
        case 'areaRelatedAt': // Extra field from Cabin->CabinToArea->Area
          return field;
        default:
          if (attrs.includes(field)) {
            return [field];
          }
          return null;
      }
    }).filter((field) => field !== null));

    return attributes;
  }
}

import { RelationMappings, JsonSchema } from '@ntb/db-utils';

import Document, {
  ApiConfigPerReferrer,
  ApiConfig,
} from './Document';


export default class PoiType extends Document {
  static tableName = 'poiTypes';
  static idColumn = 'name';
  static idColumnType = 'text';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly name!: string;
  description?: string;


  get uri() {
    return `poi_type/${this.name}`;
  }


  static relationMappings: RelationMappings = {
    pois: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'poiTypes.name',
        through: {
          modelClass: 'PoiToPoiType',
          extra: { primaryPoiType: 'primary' },
          from: 'poisToPoiTypes.poiType',
          to: 'poisToPoiTypes.poiId',
        },
        to: 'pois.id',
      },
    },
  };


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'name',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      name: { type: 'string' },
      description: { type: 'string' },
    },
  };


  static apiEntryModel = true;

  static getApiConfigPerReferrer(): ApiConfigPerReferrer {
    // Configuration when it's the entry model
    const list: ApiConfig = {
      paginate: false,
      fullTextSearch: false,
      ordering: {
        default: [['name', 'ASC']],
        validFields: ['name'],
      },
      filters: {
        name: {
          type: 'text',
          caseInsensitive: true,
          filterTypes: ['=', '$in', '$nin'],
        },
      },
      fullFields: [
        'name',
        'description',
      ],
      defaultFields: [
        'name',
        'description',
      ],
      defaultRelations: [],
    };

    // Default configuration when an instance in accessed directly
    const single: ApiConfig = list;

    // Default configuration when included from another model
    const standard: ApiConfig = {
      ...list,
      defaultFields: ['name'],
    };

    // Configuration when included through Poi.poiTypes
    const poiPoyTypes: ApiConfig = {
      ...standard,
      defaultFields: [
        ...(standard.defaultFields || []),
        'primaryPoiType',
      ],
    };

    return {
      standard,
      '*list': list,
      '*single': single,
      'Poi.poiTypes': poiPoyTypes,
    };
  }


  static getAPIFieldsToAttributes(referrers: string[], fields: string[]) {
    const extra = {
      // Related extra field from PoiType
      primaryPoiType: ['[[JOIN-TABLE]].primaryPoiType'],
    };

    const attributes = super.getAPIFieldsToAttributes(
      referrers, fields, extra,
    );

    return attributes;
  }
}

import { RelationMappings, JsonSchema } from '@ntb/db-utils';
import Document, { ApiConfigPerReferrer, ApiConfig } from './Document';


export default class Accessability extends Document {
  static tableName = 'accessabilities';
  static idColumn = 'name';
  static idColumnType = 'text';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly name!: string;
  description?: string;

  get uri() {
    return `accessability/${this.name}`;
  }


  static relationMappings: RelationMappings = {
    cabins: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'accessabilities.name',
        through: {
          modelClass: 'CabinAccessability',
          extra: { cabinAccessabilityDescription: 'description' },
          from: 'cabinAccessabilities.accessabilityName',
          to: 'cabinAccessabilities.cabinId',
        },
        to: 'cabins.id',
      },
    },
    trips: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'accessabilities.name',
        through: {
          modelClass: 'TripAccessability',
          extra: { tripAccessabilityDescription: 'description' },
          from: 'tripAccessabilities.accessabilityName',
          to: 'tripAccessabilities.tripId',
        },
        to: 'trips.id',
      },
    },
    pois: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'accessabilities.name',
        through: {
          modelClass: 'PoiAccessability',
          extra: { poiAccessabilityDescription: 'description' },
          from: 'poiAccessabilities.accessabilityName',
          to: 'poiAccessabilities.poiId',
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

    // Configuration when included through Cabin.accessabilities
    const cabinAccessabilities: ApiConfig = {
      ...standard,
      defaultFields: [
        ...(standard.defaultFields || []),
        'cabinAccessabilityDescription',
      ],
    };

    return {
      standard,
      '*single': single,
      '*list': list,
      'Cabin.accessabilities': cabinAccessabilities,
    };
  }


  static getAPIFieldsToAttributes(referrers: string[], fields: string[]) {
    const extra = {
      // Related extra field from Cabin
      cabinAccessabilityDescription: [
        '[[JOIN-TABLE]].cabinAccessabilityDescription',
      ],
    };

    const attributes = super.getAPIFieldsToAttributes(
      referrers, fields, extra,
    );

    return attributes;
  }
}

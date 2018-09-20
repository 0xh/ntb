import { RelationMappings, JsonSchema } from '@ntb/db-utils';

import Document, {
  ApiConfigPerReferrer,
  ApiConfig,
  grading,
} from './Document';
import { gradingSchema } from './schemas';


export default class Grading extends Document {
  static tableName = 'gradings';
  static idColumn = 'name';
  static idColumnType = 'text';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly name!: grading;


  get uri() {
    return `grading/${this.name}`;
  }


  static relationMappings: RelationMappings = {
    trips: {
      relation: Document.HasManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'gradings.name',
        to: 'trips.grading',
      },
    },
    routes: {
      relation: Document.HasManyRelation,
      modelClass: 'Route',
      join: {
        from: 'gradings.name',
        to: 'routes.grading',
      },
    },
  };


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'name',
    ],

    properties: {
      name: { ...gradingSchema },
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
          filterTypes: ['=', '$in', '$nin'],
        },
      },
      fullFields: [
        'name',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [],
    };

    // Default configuration when an instance in accessed directly
    const single: ApiConfig = list;

    // Default configuration when included from another model
    const standard: ApiConfig = {
      ...list,
      defaultFields: [
        'uri',
        'id',
        'name',
      ],

      defaultRelations: [],
    };

    return {
      standard,
      '*list': list,
      '*single': single,
    };
  }


  static getAPIFieldsToAttributes(referrers: string[], fields: string[]) {
    const extra = {};

    const attributes = super.getAPIFieldsToAttributes(
      referrers, fields, extra,
    );

    return attributes;
  }
}

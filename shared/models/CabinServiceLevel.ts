import { RelationMappings, JsonSchema } from '@ntb/db-utils';

import Document, {
  apiConfigPerReferrer,
  apiConfig,
  serviceLevel,
} from './Document';
import { serviceLevelSchema } from './schemas';


export default class CabinServiceLevel extends Document {
  static tableName = 'cabinServiceLevels';
  static idColumn = 'name';
  static virtualAttributes = ['uri'];

  // Database columns
  name!: serviceLevel;
  description?: string;


  get uri() {
    return `cabin_service_level/${this.name}`;
  }


  static relationMappings: RelationMappings = {
    cabins: {
      relation: Document.HasManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'cabinServiceLevels.name',
        to: 'cabins.serviceLevel',
      },
    },
    cabinsThroughOpeningHours: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'cabinServiceLevels.name',
        through: {
          modelClass: 'CabinOpeningHours',
          from: 'cabinOpeningHours.serviceLevel',
          extra: {
            openAllYear: 'allYear',
            openFrom: 'from',
            openTo: 'to',
          },
          to: 'cabinOpeningHours.cabinId',
        },
        to: 'cabins.id',
      },
    },
  };


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'name',
    ],

    properties: {
      name: { ...serviceLevelSchema },
      description: { type: 'string' },
    },
  };


  static apiEntryModel = true;

  static getApiConfigPerReferrer(): apiConfigPerReferrer {
    // Configuration when it's the entry model
    const list: apiConfig = {
      paginate: false,
      fullTextSearch: false,
      ordering: {
        default: [['name', 'ASC']],
        validFields: ['name'],
      },
      fullFields: [
        'name',
        'description',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [],
    };

    // Default configuration when an instance in accessed directly
    const single: apiConfig = list;

    // Default configuration when included from another model
    const standard: apiConfig = {
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

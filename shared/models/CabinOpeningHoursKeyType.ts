import { JsonSchema } from '@ntb/db-utils';

import Document, { ApiConfigPerReferrer, ApiConfig } from './Document';


export type cabinOpeningHoursKeyType =
  | 'dnt-key'
  | 'unlocked'
  | 'special key';


export default class CabinOpeningHoursKeyType extends Document {
  static tableName = 'cabinOpeningHoursKeyTypes';
  static idColumn = 'name';
  static virtualAttributes = [];

  // Database columns
  name!: cabinOpeningHoursKeyType;


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'name',
    ],

    properties: {
      name: {
        type: 'string',
        enum: [
          'dnt-key',
          'unlocked',
          'special key',
        ],
      },
    },
  };


  static apiEntryModel = true;

  static getApiConfigPerReferrer(): ApiConfigPerReferrer {
    // Default configuration
    const standard: ApiConfig = {
      paginate: false,
      fullTextSearch: false,
      ordering: {
        default: [['name', 'ASC']],
        validFields: ['name'],
      },
      fullFields: [
        'name',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [],
    };

    return { standard };
  }


  static getAPIFieldsToAttributes(referrers: string[], fields: string[]) {
    const extra = {};

    const attributes = super.getAPIFieldsToAttributes(
      referrers, fields, extra,
    );

    return attributes;
  }
}

import { JsonSchema } from '@ntb/db-utils';

import Document, { apiConfigPerReferrer, apiConfig } from './Document';
import { cabinPictureTypeSchema } from './schemas';


export type cabinPictureType =
  | 'winter'
  | 'summer'
  | 'interior'
  | 'other';


export default class CabinPictureType extends Document {
  static tableName = 'cabinPictureTypes';
  static idColumn = 'name';
  static virtualAttributes = [];

  // Database columns
  name!: cabinPictureType;


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'name',
    ],

    properties: {
      name: { ...cabinPictureTypeSchema },
    },
  };


  static apiEntryModel = true;

  static getApiConfigPerReferrer(): apiConfigPerReferrer {
    // Default configuration
    const standard: apiConfig = {
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

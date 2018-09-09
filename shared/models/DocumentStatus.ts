import { JsonSchema } from '@ntb/db-utils';

import Document, {
  apiConfigPerReferrer,
  apiConfig,
  documentStatus,
} from './Document';
import { documentStatusSchema } from './schemas';


export default class DocumentStatus extends Document {
  static tableName = 'documentStatuses';
  static idColumn = 'name';
  static virtualAttributes = [];

  // Database columns
  readonly name!: documentStatus;


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'name',
    ],

    properties: {
      name: { ...documentStatusSchema },
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

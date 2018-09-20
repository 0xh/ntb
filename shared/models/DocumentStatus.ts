import { JsonSchema } from '@ntb/db-utils';

import Document, {
  ApiConfigPerReferrer,
  ApiConfig,
  documentStatus,
} from './Document';
import { documentStatusSchema } from './schemas';


export default class DocumentStatus extends Document {
  static tableName = 'documentStatuses';
  static idColumn = 'name';
  static idColumnType = 'text';
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

import { JsonSchema } from '@ntb/db-utils';

import Document, {
  ApiConfigPerReferrer,
  ApiConfig,
  linkType,
} from './Document';
import { linkTypeSchema } from './schemas';


export default class GroupLink extends Document {
  static tableName = 'groupLinks';
  static idColumn = 'id';
  static virtualAttributes = [];

  // Database columns
  readonly id!: string;
  groupId!: string;
  type!: linkType;
  title?: string;
  url!: string;
  sortIndex?: number;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'type',
      'url',
    ],

    properties: {
      type: { ...linkTypeSchema },
      title: { type: 'string' },
      url: { type: 'string' },
    },
  };

  static extraIncludeInDocs = true;

  static getApiConfigPerReferrer(): ApiConfigPerReferrer {
    // Configuration when it's the entry model
    const standard: ApiConfig = {
      paginate: false,
      fullTextSearch: false,
      ordering: {
        default: [['sortIndex', 'ASC']],
        validFields: [
          'sortIndex',
          'title',
        ],
      },
      fullFields: [
        'type',
        'title',
        'url',
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

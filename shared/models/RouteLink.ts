import { JsonSchema } from '@ntb/db-utils';

import Document, {
  apiConfigPerReferrer,
  apiConfig,
  linkType,
} from './Document';
import { linkTypeSchema } from './schemas';


export default class RouteLink extends Document {
  static tableName = 'routeLinks';
  static idColumn = 'id';
  static virtualAttributes = [];

  // Database columns
  readonly id!: string;
  routeId!: string;
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


  static getApiConfigPerReferrer(): apiConfigPerReferrer {
    // Configuration when it's the entry model
    const standard: apiConfig = {
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

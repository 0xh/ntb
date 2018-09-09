import { JsonSchema } from '@ntb/db-utils';

import Document, {
  apiConfigPerReferrer,
  apiConfig,
  serviceLevel,
} from './Document';
import { cabinOpeningHoursKeyType } from './CabinOpeningHoursKeyType';
import { serviceLevelSchema } from './schemas';


export default class CabinOpeningHours extends Document {
  static tableName = 'cabinOpeningHours';
  static idColumn = 'id';
  static virtualAttributes = [];

  // Database columns
  readonly id!: string;
  cabinId!: string;
  allYear: boolean = false;
  from?: Date;
  to?: Date;
  serviceLevel?: serviceLevel;
  key?: cabinOpeningHoursKeyType;
  sortIndex?: number;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'allYear',
    ],

    properties: {
      allYear: { type: 'boolean', default: false },
      from: { type: 'string', format: 'date' },
      to: { type: 'string', format: 'date' },
      serviceLevel: { ...serviceLevelSchema },
      key: { type: 'string' },
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
          'from',
          'to',
          'allYear',
        ],
      },
      filters: {
        allYear: {},
        from: {},
        to: {},
        serviceLevel: { filterTypes: ['=', '$in', '$nin'] },
      },
      fullFields: [
        'allYear',
        'from',
        'to',
        'serviceLevel',
        'key',
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

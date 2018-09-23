import { RelationMappings, JsonSchema } from '@ntb/db-utils';

import Document, {
  ApiConfigPerReferrer,
  ApiConfig,
} from './Document';


export default class GroupType extends Document {
  static tableName = 'groupTypes';
  static idColumn = 'name';
  static idColumnType = 'text';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly name!: string;
  parent?: string;
  description?: string;


  get uri() {
    return `group_type/${this.name}`;
  }


  static relationMappings: RelationMappings = {
    parentGroupType: {
      relation: Document.BelongsToOneRelation,
      modelClass: 'GroupType',
      join: {
        from: 'groupTypes.parent',
        to: 'groupTypes.name',
      },
    },
    groupsWithMainType: {
      relation: Document.HasManyRelation,
      modelClass: 'Group',
      join: {
        from: 'groupTypes.name',
        to: 'groups.groupType',
      },
    },
    groupsWithSubType: {
      relation: Document.HasManyRelation,
      modelClass: 'Group',
      join: {
        from: 'groupTypes.name',
        to: 'groups.groupSubType',
      },
    },
  };


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'name',
    ],

    properties: {
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
        'uri',
        'name',
        'parent',
        'description',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [
        'parentGroupType',
      ],
    };

    // Default configuration when an instance in accessed directly
    const single: ApiConfig = list;

    // Default configuration when included from another model
    const standard: ApiConfig = {
      ...list,
      defaultFields: [
        'uri',
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

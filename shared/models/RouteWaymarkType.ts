import { RelationMappings, JsonSchema } from '@ntb/db-utils';

import Document, {
  ApiConfigPerReferrer,
  ApiConfig,
} from './Document';


export default class RouteWaymarkType extends Document {
  static tableName = 'routeWaymarkTypes';
  static idColumn = 'name';
  static idColumnType = 'text';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly name!: string;
  description?: string;


  get uri() {
    return `route_waymark_type/${this.name}`;
  }


  static relationMappings: RelationMappings = {
    routes: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'routeWaymarkTypes.name',
        through: {
          modelClass: 'RouteToRouteWaymarkType',
          from: 'routesToRouteWaymarkTypes.routeWaymarkTypeName',
          to: 'routesToRouteWaymarkTypes.routeId',
        },
        to: 'routes.id',
      },
    },
  };


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'name',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
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
        'name',
        'description',
      ],
      defaultFields: [
        'name',
        'description',
      ],
      defaultRelations: [],
    };

    // Default configuration when an instance in accessed directly
    const single: ApiConfig = list;

    // Default configuration when included from another model
    const standard: ApiConfig = {
      ...list,
      defaultFields: ['name'],
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

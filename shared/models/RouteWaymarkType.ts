import { RelationMappings, JsonSchema } from '@ntb/db-utils';

import Document, {
  apiConfigPerReferrer,
  apiConfig,
} from './Document';


export default class RouteWaymarkType extends Document {
  static tableName = 'routeWaymarkTypes';
  static idColumn = 'name';
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

  static getApiConfigPerReferrer(): apiConfigPerReferrer {
    // Configuration when it's the entry model
    const list: apiConfig = {
      paginate: false,
      fullTextSearch: false,
      ordering: {
        default: [['name', 'ASC']],
        validFields: ['name'],
      },
      filters: {
        name: { filterTypes: ['=', '$in', '$nin'] },
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
    const single: apiConfig = list;

    // Default configuration when included from another model
    const standard: apiConfig = {
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

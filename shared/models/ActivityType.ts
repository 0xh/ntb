import { RelationMappings, JsonSchema } from '@ntb/db-utils';

import Document, { ApiConfigPerReferrer, ApiConfig } from './Document';


export default class ActivityType extends Document {
  static tableName = 'activityTypes';
  static idColumn = 'name';
  static idColumnType = 'text';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly name!: string;
  primary: boolean = false;
  description?: string;


  get uri() {
    return `accessability/${this.name}`;
  }


  static relationMappings: RelationMappings = {
    subActivityTypes: {
      relation: Document.ManyToManyRelation,
      modelClass: 'ActivityType',
      join: {
        from: 'activityTypes.name',
        through: {
          modelClass: 'ActivityTypesToActivityTypes',
          from: 'activityTypesToActivityTypes.primaryType',
          to: 'activityTypesToActivityTypes.subType',
        },
        to: 'activityTypes.name',
      },
    },
    primaryActivityTypes: {
      relation: Document.ManyToManyRelation,
      modelClass: 'ActivityType',
      join: {
        from: 'activityTypes.name',
        through: {
          modelClass: 'ActivityTypesToActivityTypes',
          from: 'activityTypesToActivityTypes.subType',
          to: 'activityTypesToActivityTypes.primaryType',
        },
        to: 'activityTypes.name',
      },
    },
    routes: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'activityTypes.name',
        through: {
          modelClass: 'RouteToActivityType',
          from: 'routesToActivityTypes.activityTypeName',
          to: 'routesToActivityTypes.routeId',
        },
        to: 'routes.id',
      },
    },
    trips: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'activityTypes.name',
        through: {
          modelClass: 'TripToActivityType',
          from: 'tripsToActivityTypes.activityTypeName',
          to: 'tripsToActivityTypes.tripId',
        },
        to: 'trips.id',
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
      primary: { type: 'boolean' },
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
        default: [
          ['primary', 'DESC'],
          ['name', 'ASC'],
        ],
        validFields: [
          'name',
          'primary',
        ],
      },
      filters: {
        name: {
          type: 'text',
          filterTypes: ['=', '$in', '$nin'],
        },
        primary: { type: 'boolean' },
      },
      fullFields: [
        'name',
        'primary',
        'description',
      ],
      defaultFields: [
        'name',
        'primary',
        'description',
      ],
      defaultRelations: [],
    };

    // Default configuration when an instance in accessed directly
    const single: ApiConfig = list;

    // Default configuration when included from another model
    const standard: ApiConfig = {
      ...list,
      defaultFields: [
        'name',
      ],
      defaultRelations: [],
    };

    return {
      standard,
      list,
      single,
    };
  }


  static getAPIFieldsToAttributes(referrers: string[], fields: string[]) {
    const extra = {
      // Related extra field from Trip.subActivityTypes
      primaryActivityType: ['[[JOIN-TABLE]].primaryActivityType'],
    };

    const attributes = super.getAPIFieldsToAttributes(
      referrers, fields, extra,
    );

    return attributes;
  }
}

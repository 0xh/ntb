import { geojson } from '@ntb/gis-utils';
import { RelationMappings, JsonSchema } from '@ntb/db-utils';

import Document, {
  ApiConfigPerReferrer,
  ApiConfig,
} from './Document';
import {
  geojsonPointSchema,
  geojsonLineStringSchema,
} from './schemas';


export type routeSegmentType =
  | 'bike'
  | 'foot'
  | 'other'
  | 'ski';


export default class RouteSegment extends Document {
  static tableName = 'routeSegments';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly id!: string;
  type?: routeSegmentType;
  gmlIds?: string[];
  maintainers?: string[];
  calculatedDistance?: number;
  path?: geojson.LineString;
  pointA?: geojson.Point;
  pointB?: geojson.Point;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;
  pathUpdatedAt?: Date;
  processedElevationUpdatedAt?: Date;

  get uri() {
    return `route_segment/${this.id}`;
  }

  static relationMappings: RelationMappings = {
    routes: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'routeSegments.id',
        through: {
          modelClass: 'RouteToRouteSegment',
          from: 'routesToRouteSegments.routeSegmentId',
          to: 'routesToRouteSegments.routeId',
        },
        to: 'routes.id',
      },
    },
  };


  static geometryAttributes = [
    'path',
    'pointA',
    'pointB',
  ];


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'type',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { type: 'string', format: 'uuid', readOnly: true },
      type: {
        type: 'string',
        enum: [
          'bike',
          'goot',
          'other',
          'ski',
        ],
      },
      gml_ids: {
        type: 'array',
        items: [
          {
            type: 'string',
          },
        ],
      },
      maintainers: {
        type: 'array',
        items: [
          {
            type: 'string',
          },
        ],
      },
      calculatedDistance: { type: 'number' },
      path: { ...geojsonLineStringSchema },
      pointA: { ...geojsonPointSchema },
      pointB: { ...geojsonPointSchema },
      dataSource: { type: 'string' },
      updatedAt: { type: 'string', format: 'date', readOnly: true },
      createdAt: { type: 'string', format: 'date', readOnly: true },
    },
  };


  static apiEntryModel = true;


  static getApiConfigPerReferrer(): ApiConfigPerReferrer {
    // Configuration when it's the entry model
    const list: ApiConfig = {
      paginate: {
        defaultLimit: 10,
        maxLimit: 50,
      },
      fullTextSearch: true,
      ordering: {
        default: [['id', 'ASC']],
        validFields: [
          'id',
          'updatedAt',
          'createdAt',
        ],
      },
      filters: {
        id: { type: 'uuid' },
      },
      fullFields: [
        'uri',
        'id',
        'maintainers',
        'calculatedDistance',
        'path',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [
        'routes',
      ],
    };

    // Default configuration when an instance in accessed directly
    const single: ApiConfig = list;

    // Default configuration when included from another model
    const standard: ApiConfig = {
      ...list,
      defaultFields: [
        'uri',
        'id',
        'maintainers',
        'calculatedDistance',
        'path',
      ],

      defaultRelations: [],
    };

    // When included by Route.route_segments
    const routeRouteSegments: ApiConfig = {
      ...standard,
      paginate: false,
    };

    return {
      standard,
      '*list': list,
      '*single': single,
      'Route.routeSegments': routeRouteSegments,
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

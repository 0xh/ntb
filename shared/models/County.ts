import { RelationMappings, JsonSchema } from '@ntb/db-utils';
import { geojson } from '@ntb/gis-utils';

import Document, {
  ApiConfigPerReferrer,
  ApiConfig,
  documentStatus,
} from './Document';
import { documentStatusSchema, geojsonPolygonSchema } from './schemas';


export default class County extends Document {
  static tableName = 'counties';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly id!: string;
  code!: string;
  name!: string;
  nameLowerCase!: string;
  status!: documentStatus;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;
  geometry?: geojson.Polygon;
  geometryUpdatedAt?: Date;
  processedRelationsUpdatedAt?: Date;


  get uri() {
    return `county/${this.id}`;
  }


  static relationMappings: RelationMappings = {
    areas: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Area',
      join: {
        from: 'counties.id',
        through: {
          modelClass: 'AreaToCounty',
          from: 'areasToCounties.countyId',
          to: 'areasToCounties.areaId',
        },
        to: 'areas.id',
      },
    },
    hazardRegions: {
      relation: Document.ManyToManyRelation,
      modelClass: 'HazardRegion',
      join: {
        from: 'counties.id',
        through: {
          modelClass: 'CountyToHazardRegion',
          from: 'countiesToHazardRegions.countyId',
          to: 'countiesToHazardRegions.hazardRegionId',
        },
        to: 'hazardRegions.id',
      },
    },
    routes: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'counties.id',
        through: {
          modelClass: 'RouteToCounty',
          from: 'routesToCounties.countyId',
          to: 'routesToCounties.routeId',
        },
        to: 'routes.id',
      },
    },
    trips: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'counties.id',
        through: {
          modelClass: 'TripToCounty',
          from: 'tripsToCounties.countyId',
          to: 'tripsToCounties.tripId',
        },
        to: 'trips.id',
      },
    },
  };

  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'name',
      'provider',
      'status',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { type: 'string', format: 'uuid', readOnly: true },
      code: { type: 'string' },
      name: { type: 'string', minLength: 2, maxLength: 100 },
      geometry: { ...geojsonPolygonSchema },
      status: { ...documentStatusSchema },
      updatedAt: { format: 'date', readOnly: true },
      createdAt: { format: 'date', readOnly: true },
    },
  };

  static apiEntryModel = true;

  static getApiConfigPerReferrer(): ApiConfigPerReferrer {
    // Configuration when it's the entry model
    const list: ApiConfig = {
      paginate: {
        maxLimit: 50,
        defaultLimit: 10,
      },
      fullTextSearch: true,
      translated: true,
      translatedFields: ['name', 'nameLowerCase'],
      ordering: {
        validFields: [
          'name',
          'updatedAt',
          'createdAt',
        ],
        default: [['name', 'ASC']],
      },
      filters: {
        id: { type: 'uuid' },
        code: {
          type: 'text',
          filterTypes: ['=', '$in', '$nin'],
        },
        name: { type: 'text' },
        status: {
          type: 'text',
          filterTypes: ['=', '$in', '$nin'],
        },
        updatedAt: { type: 'date' },
        createdAt: { type: 'date' },
      },
      fullFields: [
        'uri',
        'id',
        'code',
        'name',
        'status',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [],
    };

    // Default configuration when included from another model
    const single: ApiConfig = list;

    // Default configuration when included from another model
    const standard: ApiConfig = {
      ...list,
      defaultFields: [
        'uri',
        'id',
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

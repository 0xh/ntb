import { RelationMappings, JsonSchema } from '@ntb/db-utils';
import { geojson } from '@ntb/gis-utils';

import Document, {
  ApiConfigPerReferrer,
  ApiConfig,
} from './Document';
import { geojsonPolygonSchema } from './schemas';


export default class HazardRegion extends Document {
  static tableName = 'hazardRegions';
  static idColumn = 'id';
  static idColumnType = 'uuid';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly id!: string;
  type!: string;
  name!: string;
  regionId!: number;
  regionTypeId?: number;
  regionType?: string;
  geometry?: geojson.Polygon;
  createdAt!: Date;
  updatedAt!: Date;
  geometryUpdatedAt?: Date;
  processedRelationsUpdatedAt?: Date;


  get uri() {
    return `hazard_region/${this.id}`;
  }


  static relationMappings: RelationMappings = {
    cabins: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'hazardRegions.id',
        through: {
          modelClass: 'CabinToHazardRegion',
          from: 'cabinsToHazardRegions.hazardRegionId',
          to: 'cabinsToHazardRegions.cabinId',
        },
        to: 'cabins.id',
      },
    },
    routes: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'hazardRegions.id',
        through: {
          modelClass: 'RouteToHazardRegion',
          from: 'routesToHazardRegions.hazardRegionId',
          to: 'routesToHazardRegions.routeId',
        },
        to: 'routes.id',
      },
    },
    trips: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'hazardRegions.id',
        through: {
          modelClass: 'TripToHazardRegion',
          from: 'tripsToHazardRegions.hazardRegionId',
          to: 'tripsToHazardRegions.tripId',
        },
        to: 'trips.id',
      },
    },
    pois: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'hazardRegions.id',
        through: {
          modelClass: 'PoiToHazardRegion',
          from: 'poisToHazardRegions.hazardRegionId',
          to: 'poisToHazardRegions.poiId',
        },
        to: 'pois.id',
      },
    },
    areas: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Area',
      join: {
        from: 'hazardRegions.id',
        through: {
          modelClass: 'AreaToHazardRegion',
          from: 'areasToHazardRegions.hazardRegionId',
          to: 'areasToHazardRegions.areaId',
        },
        to: 'areas.id',
      },
    },
    counties: {
      relation: Document.ManyToManyRelation,
      modelClass: 'County',
      join: {
        from: 'hazardRegions.id',
        through: {
          modelClass: 'CountyToHazardRegion',
          from: 'countiesToHazardRegions.hazardRegionId',
          to: 'countiesToHazardRegions.countyId',
        },
        to: 'counties.id',
      },
    },
    municipalities: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Municipality',
      join: {
        from: 'hazardRegions.id',
        through: {
          modelClass: 'MunicipalityToHazardRegion',
          from: 'municipalitiesToHazardRegions.hazardRegionId',
          to: 'municipalitiesToHazardRegions.municipalityId',
        },
        to: 'municipalities.id',
      },
    },
  };


  static geometryAttributes = [
    'geometry',
  ];


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'name',
      'geometry',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { type: 'string', format: 'uuid', readOnly: true },
      type: { type: 'string' },
      name: { type: 'string', minLength: 2, maxLength: 100 },
      regionId: { type: 'number' },
      regionTypeId: { type: 'number' },
      regionType: { type: 'string' },
      geometry: { ...geojsonPolygonSchema },
      updatedAt: { type: 'string', format: 'date', readOnly: true },
      createdAt: { type: 'string', format: 'date', readOnly: true },
    },
  };

  static apiEntryModel = true;

  static getApiConfigPerReferrer(): ApiConfigPerReferrer {
    const list: ApiConfig = {
      paginate: {
        defaultLimit: 10,
        maxLimit: 50,
      },
      fullTextSearch: false,
      ordering: {
        default: [['name', 'ASC']],
        validFields: [
          'name',
          'region_id',
          'updatedAt',
          'createdAt',
        ],
      },
      filters: {
        id: { type: 'uuid' },
        type: {
          type: 'text',
          caseInsensitive: true,
          filterTypes: ['=', '$in', '$nin'],
        },
        regionId: {
          type: 'number',
          filterTypes: ['=', '$in', '$nin'],
        },
      },
      fullFields: [
        'uri',
        'id',
        'type',
        'name',
        'regionId',
        'regionTypeId',
        'regionType',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [],
    };

    // Default configuration when an instance in accessed directly
    const single: ApiConfig = list;

    // Default configuration when included from another model
    const standard: ApiConfig = {
      ...list,
      paginate: false,
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

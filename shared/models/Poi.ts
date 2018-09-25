import { geojson } from '@ntb/gis-utils';
import { RelationMappings, JsonSchema } from '@ntb/db-utils';

import Document, {
  ApiConfigPerReferrer,
  ApiConfig,
  documentStatus,
} from './Document';
import { documentStatusSchema, geojsonPointSchema } from './schemas';


export default class Poi extends Document {
  static tableName = 'pois';
  static idColumn = 'id';
  static idColumnType = 'uuid';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly id!: string;
  readonly idLegacyNtb?: string;
  isSsr?: string;
  type!: string;
  name!: string;
  nameLowerCase!: string;
  description?: string;
  descriptionPlain?: string;
  coordinates?: geojson.Point;
  season?: number[];
  open?: boolean;
  countyId?: string;
  municipalityId?: string;
  license?: string;
  provider!: string;
  status!: documentStatus;
  dataSource?: string;
  searchDocumentBoost?: number;
  searchNb?: string;
  searchEn?: string;
  createdAt!: Date;
  updatedAt!: Date;
  coordinatesUpdatedAt?: Date;
  processedRelationsUpdatedAt?: Date;
  processedElevationUpdatedAt?: Date;


  get uri() {
    return `poi/${this.id}`;
  }


  static relationMappings: RelationMappings = {
    // TODO(roar):
    // lists

    poiTypes: {
      relation: Document.ManyToManyRelation,
      modelClass: 'PoiType',
      join: {
        from: 'pois.id',
        through: {
          modelClass: 'PoiToPoiType',
          from: 'poisToPoiTypes.poiId',
          extra: { primaryPoiType: 'primary' },
          to: 'poisToPoiTypes.poiType',
        },
        to: 'poiTypes.name',
      },
    },
    links: {
      relation: Document.HasManyRelation,
      modelClass: 'PoiLink',
      join: {
        from: 'pois.id',
        to: 'poiLinks.poiId',
      },
    },
    accessabilities: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Accessability',
      join: {
        from: 'pois.id',
        through: {
          modelClass: 'PoiAccessability',
          extra: { poiAccessabilityDescription: 'description' },
          from: 'poiAccessabilities.poiId',
          to: 'poiAccessabilities.accessabilityName',
        },
        to: 'accessabilities.name',
      },
    },
    pictures: {
      relation: Document.HasManyRelation,
      modelClass: 'Picture',
      join: {
        from: 'pois.id',
        to: 'pictures.poiId',
      },
    },
    areas: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Area',
      join: {
        from: 'pois.id',
        through: {
          modelClass: 'PoiToArea',
          from: 'poisToAreas.poiId',
          to: 'poisToAreas.areaId',
        },
        to: 'areas.id',
      },
    },
    groups: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Group',
      join: {
        from: 'pois.id',
        through: {
          modelClass: 'PoiToGroup',
          from: 'poisToGroups.poiId',
          to: 'poisToGroups.groupId',
        },
        to: 'groups.id',
      },
    },
    county: {
      relation: Document.BelongsToOneRelation,
      modelClass: 'County',
      join: {
        from: 'pois.countyId',
        to: 'counties.id',
      },
    },
    municipality: {
      relation: Document.BelongsToOneRelation,
      modelClass: 'Municipality',
      join: {
        from: 'pois.municipalityId',
        to: 'municipalities.id',
      },
    },
    routes: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'pois.id',
        through: {
          modelClass: 'RouteToPoi',
          from: 'routesToPois.poiId',
          to: 'routesToPois.routeId',
        },
        to: 'routes.id',
      },
    },
    trips: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'pois.id',
        through: {
          modelClass: 'TripToPoi',
          from: 'tripsToPois.poiId',
          to: 'tripsToPois.routeId',
        },
        to: 'trips.id',
      },
    },
    hazardRegions: {
      relation: Document.ManyToManyRelation,
      modelClass: 'HazardRegion',
      join: {
        from: 'pois.id',
        through: {
          modelClass: 'PoiToHazardRegion',
          from: 'poisToHazardRegions.poiId',
          to: 'poisToHazardRegions.hazardRegionId',
        },
        to: 'hazardRegions.id',
      },
    },
    routesByDistance: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'pois.id',
        through: {
          modelClass: 'RouteToPoiByDistance',
          extra: { calculatedDistance: 'calculatedDistance' },
          from: 'routesToPoisByDistance.poiId',
          to: 'routesToPoisByDistance.routeId',
        },
        to: 'routes.id',
      },
    },
    cabinsByDistance: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'pois.id',
        through: {
          modelClass: 'CabinToPoiByDistance',
          extra: { calculatedDistance: 'calculatedDistance' },
          from: 'cabinsToPoisByDistance.poiId',
          to: 'cabinsToPoisByDistance.cabinId',
        },
        to: 'cabins.id',
      },
    },
    tripsByDistance: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'pois.id',
        through: {
          modelClass: 'TripToPoiByDistance',
          extra: { calculatedDistance: 'calculatedDistance' },
          from: 'tripsToPoisByDistance.poiId',
          to: 'tripsToPoisByDistance.tripId',
        },
        to: 'trips.id',
      },
    },
    poisByDistance: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'pois.id',
        through: {
          modelClass: 'PoiToPoiByDistance',
          extra: { calculatedDistance: 'calculatedDistance' },
          from: 'poisToPoisByDistance.poiAId',
          to: 'poisToPoisByDistance.poiBId',
        },
        to: 'pois.id',
      },
    },
  };


  static geometryAttributes = [
    'coordinates',
  ];


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'name',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { type: 'string', format: 'uuid', readOnly: true },
      idLegacyNtb: { type: 'string', readOnly: true, noApiReturn: true },
      idSsr: { type: 'string', maxLength: 100 },
      type: { type: 'string', maxLength: 100 },
      name: { type: 'string', minLength: 2, maxLength: 100 },
      description: { type: 'string', maxLength: 100000 },
      descriptionPlain: { type: 'string', readOnly: true },
      coordinates: { ...geojsonPointSchema },
      season: {
        type: 'array',
        items: [
          {
            type: 'number',
          },
        ],
      },
      open: { type: 'boolean' },
      license: { type: 'string', maxLength: 300 },
      provider: { type: 'string', maxLength: 300, readOnly: true },
      status: { ...documentStatusSchema },
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
      fullTextSearchLangauges: ['nb', 'en'],
      ordering: {
        default: [['name', 'ASC']],
        validFields: [
          'name',
          'updatedAt',
          'createdAt',
        ],
      },
      filters: {
        id: { type: 'uuid' },
        shortId: {
          type: 'short-uuid',
          tableAttribute: 'id',
        },
        idLegacyNtb: {
          type: 'text',
          filterTypes: ['=', '$in', '$nin'],
        },
        idSsr: {
          type: 'text',
          filterTypes: ['=', 'null', 'notnull', '$in', '$nin'],
        },
        type: {
          type: 'text',
          caseInsensitive: true,
          filterTypes: ['=', 'null', 'notnull', '$in', '$nin'],
        },
        name: {
          type: 'text',
          tableAttribute: 'nameLowerCase',
          caseInsensitive: true,
        },
        coordinates: { type: 'geojson' },
        provider: {
          type: 'text',
          caseInsensitive: true,
          filterTypes: ['=', '$in', '$nin'],
        },
        status: {
          type: 'text',
          caseInsensitive: true,
          filterTypes: ['=', '$in', '$nin'],
        },
        updatedAt: { type: 'date' },
        createdAt: { type: 'date' },
      },
      fullFields: [
        'uri',
        'id',
        'idSsr',
        'type',
        'name',
        'description',
        'coordinates',
        'season',
        'open',
        'license',
        'provider',
        'status',
        'updatedAt',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [
        'accessabilities',
        'poiTypes',
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
        'name',
      ],
      defaultRelations: [],
    };

    // Configuration when included through Accessability.pois
    const accessabilityPois: ApiConfig = {
      ...standard,
      defaultFields: [
        ...(standard.defaultFields || []),
        'poiAccessabilityDescription',
      ],
    };

    // Configuration when included through PoiType.pois
    const poiTypePois: ApiConfig = {
      ...standard,
      defaultFields: [
        ...(standard.defaultFields || []),
        'primaryPoiType',
      ],
    };

    // Configuration when included through distance table
    const poisByDistance: ApiConfig = {
      ...standard,
      defaultFields: [
        ...(standard.defaultFields || []),
        'calculatedDistance',
      ],
    };

    return {
      standard,
      '*list': list,
      '*single': single,
      'Accessability.pois': accessabilityPois,
      'PoiType.pois': poiTypePois,
      'Route.poisByDistance': poisByDistance,
      'Cabin.poisByDistance': poisByDistance,
      'Trip.poisByDistance': poisByDistance,
      'Poi.poisByDistance': poisByDistance,
    };
  }


  static getAPIFieldsToAttributes(referrers: string[], fields: string[]) {
    const extra = {
      // Related extra field from Accessability
      poiAccessabilityDescription: [
        '[[JOIN-TABLE]].poiAccessabilityDescription',
      ],
      // Related extra field from Route++
      calculatedDistance: ['[[JOIN-TABLE]].calculatedDistance'],
      // Related extra field from PoiType
      primaryPoiType: ['[[JOIN-TABLE]].primaryPoiType'],
    };

    const attributes = super.getAPIFieldsToAttributes(
      referrers, fields, extra,
    );

    return attributes;
  }
}

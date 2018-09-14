import { RelationMappings, JsonSchema } from '@ntb/db-utils';
import { geojson } from '@ntb/gis-utils';

import Document, {
  apiConfigPerReferrer,
  apiConfig,
  documentStatus,
  grading,
} from './Document';
import { documentStatusSchema, gradingSchema } from './schemas';


export default class Route extends Document {
  static tableName = 'routes';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly id!: string;
  readonly idLegacyNtbAb?: string;
  readonly idLegacyNtbBa?: string;
  code!: string;
  type?: string;
  name?: string;
  nameLowerCase?: string;
  description?: string;
  descriptionPlain?: string;
  descriptionAb?: string;
  descriptionAbPlain?: string;
  descriptionBa?: string;
  descriptionBaPlain?: string;
  url?: string;
  source?: string;
  notes?: string;
  grading?: grading;
  suitableForChildren: boolean = false;
  distance?: number;
  calculatedDistance?: number;
  waymarkWinterAllYear: boolean = false;
  waymarkWinterFrom?: Date;
  waymarkWinterTo?: Date;
  waymarkWinterComment?: string;
  durationMinutes?: number;
  durationHours?: number;
  durationDays?: number;
  season?: number[];
  license?: string;
  provider!: string;
  status!: documentStatus;
  dataSource?: string;
  searchDocumentBoost?: number;
  searchNb?: string;
  searchEn?: string;
  createdAt!: Date;
  updatedAt!: Date;
  path?: geojson.LineString | geojson.MultiLineString;
  pathBuffer?: geojson.Polygon | geojson.MultiPolygon;
  pathUpdatedAt?: Date;
  processedRelationsUpdatedAt?: Date;

  get uri() {
    return `route/${this.id}`;
  }

  static relationMappings: RelationMappings = {
    routeSegments: {
      relation: Document.ManyToManyRelation,
      modelClass: 'RouteSegment',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToRouteSegment',
          from: 'routesToRouteSegments.routeId',
          to: 'routesToRouteSegments.routeSegmentId',
        },
        to: 'routeSegments.id',
      },
    },
    activityTypes: {
      relation: Document.ManyToManyRelation,
      modelClass: 'ActivityType',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToActivityType',
          from: 'routesToActivityTypes.routeId',
          to: 'routesToActivityTypes.activityTypeName',
        },
        to: 'activityTypes.name',
      },
    },
    routeWaymarkTypes: {
      relation: Document.ManyToManyRelation,
      modelClass: 'RouteWaymarkType',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToRouteWaymarkType',
          from: 'routesToRouteWaymarkTypes.routeId',
          to: 'routesToRouteWaymarkTypes.routeWaymarkTypeName',
        },
        to: 'routeWaymarkTypes.name',
      },
    },
    counties: {
      relation: Document.ManyToManyRelation,
      modelClass: 'County',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToCounty',
          from: 'routesToCounties.routeId',
          to: 'routesToCounties.countyId',
        },
        to: 'counties.id',
      },
    },
    municipalities: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Municipality',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToMunicipality',
          from: 'routesToMunicipalities.routeId',
          to: 'routesToMunicipalities.municipalityId',
        },
        to: 'municipalities.id',
      },
    },
    groups: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Group',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToGroup',
          from: 'routesToGroups.routeId',
          to: 'routesToGroups.groupId',
        },
        to: 'groups.id',
      },
    },
    pois: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToPoi',
          from: 'routesToPois.routeId',
          to: 'routesToPois.poiId',
        },
        to: 'pois.id',
      },
    },
    links: {
      relation: Document.HasManyRelation,
      modelClass: 'RouteLink',
      join: {
        from: 'routes.id',
        to: 'routeLinks.routeId',
      },
    },
    pictures: {
      relation: Document.HasManyRelation,
      modelClass: 'Picture',
      join: {
        from: 'routes.id',
        to: 'pictures.routeId',
      },
    },
    hazardRegions: {
      relation: Document.ManyToManyRelation,
      modelClass: 'HazardRegion',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToHazardRegion',
          from: 'routesToHazardRegions.routeId',
          to: 'routesToHazardRegions.hazardRegionId',
        },
        to: 'hazardRegions.id',
      },
    },
    areas: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Area',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToArea',
          from: 'routesToAreas.routeId',
          to: 'routesToAreas.areaId',
        },
        to: 'areas.id',
      },
    },
    poisByDistance: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToPoiByDistance',
          extra: { calculatedDistance: 'calculatedDistance' },
          from: 'routesToPoisByDistance.routeId',
          to: 'routesToPoisByDistance.poiId',
        },
        to: 'pois.id',
      },
    },
    cabinsByDistance: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToCabinByDistance',
          extra: { calculatedDistance: 'calculatedDistance' },
          from: 'routesToCabinsByDistance.routeId',
          to: 'routesToCabinsByDistance.cabinId',
        },
        to: 'cabins.id',
      },
    },
    tripsByDistance: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToTripByDistance',
          extra: { calculatedDistance: 'calculatedDistance' },
          from: 'routesToTripsByDistance.routeId',
          to: 'routesToTripsByDistance.tripId',
        },
        to: 'trips.id',
      },
    },
    routesByDistance: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'routes.id',
        through: {
          modelClass: 'RouteToRouteByDistance',
          extra: { calculatedDistance: 'calculatedDistance' },
          from: 'routesToRoutesByDistance.routeAId',
          to: 'routesToRoutesByDistance.routeBId',
        },
        to: 'routes.id',
      },
    },
  };


  static geometryAttributes = [
    'path',
  ];


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'code',
      'isWinter',
      'name',
      'suitableForChildren',
      'waymarkWinterAllYear',
      'provider',
      'status',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { type: 'string', format: 'uuid', readOnly: true },
      idLegacyNtbAb: { type: 'string', readOnly: true, noApiReturn: true },
      idLegacyNtbBa: { type: 'string', readOnly: true, noApiReturn: true },
      code: { type: 'string' },
      type: { type: 'string' },
      name: { type: 'string', minLength: 2, maxLength: 100 },
      description: { type: 'string', maxLength: 100000 },
      descriptionAb: { type: 'string', maxLength: 100000 },
      descriptionBa: { type: 'string', maxLength: 100000 },
      url: { type: 'string', maxLength: 100 },
      source: { type: 'string', maxLength: 100 },
      notes: { type: 'string', maxLength: 100 },
      grading: { ...gradingSchema },
      suitableForChildren: { type: 'boolean', default: false },
      distance: { type: 'number' },
      calculatedDistance: { type: 'number' },
      waymarkWinter: {
        type: 'object',
        properties: {
          allYear: { type: 'boolean', default: false },
          from: { type: 'string', format: 'date' },
          to: { type: 'string', format: 'date' },
          comment: { type: 'string', maxLength: 100 },
        },
      },
      duration: {
        type: 'object',
        properties: {
          minutes: { type: 'number' },
          hours: { type: 'number' },
          days: { type: 'number' },
        },
      },
      season: {
        type: 'array',
        items: [
          {
            type: 'number',
          },
        ],
      },
      license: { type: 'string', maxLength: 300 },
      provider: { type: 'string', maxLength: 300, readOnly: true },
      status: { ...documentStatusSchema },
      updatedAt: { type: 'string', format: 'date', readOnly: true },
      createdAt: { type: 'string', format: 'date', readOnly: true },
    },
  };


  $parseDatabaseJson(databaseJson: { [P in keyof Route]: Route[P] }) {
    const json = super.$parseDatabaseJson(databaseJson);

    // Create waymarkWinter object
    json.waymarkWinter = {
      allYear: databaseJson.waymarkWinterAllYear,
      from: databaseJson.waymarkWinterFrom,
      to: databaseJson.waymarkWinterTo,
      comment: databaseJson.waymarkWinterComment,
    };

    // Remove from databaseJson
    delete json.waymarkWinterAllYear;
    delete json.waymarkWinterFrom;
    delete json.waymarkWinterTo;
    delete json.waymarkWinterComment;

    // Create duration object
    json.duration = {
      minutes: databaseJson.durationMinutes,
      hours: databaseJson.durationHours,
      days: databaseJson.durationDays,
    };

    // Remove from databaseJson
    delete json.durationMinutes;
    delete json.durationHours;
    delete json.durationDays;

    return json;
  }



  static apiEntryModel = true;


  static getApiConfigPerReferrer(): apiConfigPerReferrer {
    // Configuration when it's the entry model
    const list: apiConfig = {
      paginate: {
        defaultLimit: 10,
        maxLimit: 50,
      },
      fullTextSearch: true,
      ordering: {
        default: [['name', 'ASC']],
        validFields: [
          'name',
          'updatedAt',
          'createdAt',
        ],
      },
      filters: {
        id: {},
        type: { filterTypes: ['=', '$in', '$nin'] },
        idLegacyNtbAb: {
          filterTypes: ['=', 'null', 'notnull', '$in', '$nin'],
        },
        idLegacyNtbBa: {
          filterTypes: ['=', 'null', 'notnull', '$in', '$nin'],
        },
        isWinter: {},
        name: {},
        source: { filterTypes: ['=', 'null', 'notnull', '$in', '$nin'] },
        grading: { filterTypes: ['=', 'null', 'notnull', '$in', '$nin'] },
        suitableForChildren: {},
        distance: {},
        provider: { filterTypes: ['=', '$in', '$nin'] },
        status: { filterTypes: ['=', '$in', '$nin'] },
        updatedAt: {},
        createdAt: {},
      },
      fullFields: [
        'uri',
        'id',
        'code',
        'isWinter',
        'name',
        'description',
        'descriptionAb',
        'descriptionBa',
        'url',
        'notes',
        'grading',
        'suitableForChildren',
        'distance',
        'calculatedDistance',
        'duration',
        'waymarkWinter',
        'season',
        'license',
        'provider',
        'status',
        'updatedAt',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [
        'ownerGroup',
        'contactGroup',
        'maintainerGroup',
        'activityTypes',
      ],
    };

    // Default configuration when an instance in accessed directly
    const single: apiConfig = list;

    // Default configuration when included from another model
    const standard: apiConfig = {
      ...list,
      defaultFields: [
        'uri',
        'id',
        'name',
      ],

      defaultRelations: [],
    };

    // Configuration when included through distance table
    const routesByDistance: apiConfig = {
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
      'Poi.routesByDistance': routesByDistance,
      'Cabin.routesByDistance': routesByDistance,
      'Trip.routesByDistance': routesByDistance,
      'Route.routesByDistance': routesByDistance,
    };
  }


  static getAPIFieldsToAttributes(referrers: string[], fields: string[]) {
    const extra = {
      // Related extra field from Accessability
      cabinAccessabilityDescription: [
        '[[JOIN-TABLE]].cabinAccessabilityDescription'
      ],
      // Related extra field from poisByDistance, cabinsByDistance
      calculatedDistance: ['[[JOIN-TABLE]].calculatedDistance'],

      waymarkWinter: [
        'waymarkWinterAllYear',
        'waymarkWinterFrom',
        'waymarkWinterTo',
        'waymarkWinterComment',
      ],
      duration: [
        'durationMinutes',
        'durationHours',
        'durationDays',
      ],
    };

    const attributes = super.getAPIFieldsToAttributes(
      referrers, fields, extra,
    );

    return attributes;
  }
}

import { geojson } from '@ntb/gis-utils';
import { RelationMappings, JsonSchema } from '@ntb/db-utils';

import Document, {
  ApiConfigPerReferrer,
  ApiConfig,
  documentStatus,
  grading,
} from './Document';
import {
  documentStatusSchema,
  geojsonPointSchema,
  geojsonLineStringSchema,
  gradingSchema,
} from './schemas';


export default class Trip extends Document {
  static tableName = 'trips';
  static idColumn = 'id';
  static idColumnType = 'uuid';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly id!: string;
  readonly idLegacyNtb?: string;
  activityType?: string;
  name!: string;
  nameLowerCase!: string;
  description?: string;
  descriptionPlain?: string;
  url?: string;
  grading?: grading;
  suitableForChildren: boolean = false;
  distance?: number;
  direction?: string;
  durationMinutes?: number;
  durationHours?: number;
  durationDays?: number;
  startingPoint?: geojson.Point;
  path?: geojson.LineString;
  pathPolyline?: string;
  season?: number[];
  htgtGeneral?: string;
  htgtWinter?: string;
  htgtSummer?: string;
  htgtPublicTransport?: string;
  htgtCarAllYear?: boolean;
  htgtCarSummer?: boolean;
  htgtBicycle?: boolean;
  htgtPublicTransportAvailable?: boolean;
  htgtBoatTransportAvailable?: boolean;
  license?: string;
  provider!: string;
  status!: documentStatus;
  dataSource?: string;
  searchDocumentBoost?: number;
  searchNb?: string;
  searchEn?: string;
  createdAt!: Date;
  updatedAt!: Date;
  pathBuffer?: geojson.Polygon;
  pathUpdatedAt?: Date;
  processedRelationsUpdatedAt?: Date;
  processedElevationUpdatedAt?: Date;


  get uri() {
    return `trip/${this.id}`;
  }


  static relationMappings: RelationMappings = {
    subActivityTypes: {
      relation: Document.ManyToManyRelation,
      modelClass: 'ActivityType',
      join: {
        from: 'trips.id',
        through: {
          modelClass: 'TripToActivityType',
          extra: { primaryActivityType: 'primary' },
          from: 'tripsToActivityTypes.tripId',
          to: 'tripsToActivityTypes.activityTypeName',
        },
        to: 'activityTypes.name',
      },
    },
    groups: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Group',
      join: {
        from: 'trips.id',
        through: {
          modelClass: 'TripToGroup',
          from: 'tripsToGroups.tripId',
          to: 'tripsToGroups.groupId',
        },
        to: 'groups.id',
      },
    },
    accessabilities: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Accessability',
      join: {
        from: 'trips.id',
        through: {
          modelClass: 'TripAccessability',
          extra: { tripAccessabilityDescription: 'description' },
          from: 'tripAccessabilities.tripId',
          to: 'tripAccessabilities.accessabilityName',
        },
        to: 'accessabilities.name',
      },
    },
    pois: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'trips.id',
        through: {
          modelClass: 'TripToPoi',
          from: 'tripsToPois.tripId',
          to: 'tripsToPois.poiId',
        },
        to: 'pois.id',
      },
    },
    counties: {
      relation: Document.ManyToManyRelation,
      modelClass: 'County',
      join: {
        from: 'trips.id',
        through: {
          modelClass: 'TripToCounty',
          from: 'tripsToCounties.tripId',
          to: 'tripsToCounties.countyId',
        },
        to: 'counties.id',
      },
    },
    municipalities: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Municipality',
      join: {
        from: 'trips.id',
        through: {
          modelClass: 'TripToMunicipality',
          from: 'tripsToMunicipalities.tripId',
          to: 'tripsToMunicipalities.municipalityId',
        },
        to: 'municipalities.id',
      },
    },
    areas: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Area',
      join: {
        from: 'trips.id',
        through: {
          modelClass: 'TripToArea',
          from: 'tripsToAreas.tripId',
          to: 'tripsToAreas.areaId',
        },
        to: 'areas.id',
      },
    },
    links: {
      relation: Document.HasManyRelation,
      modelClass: 'TripLink',
      join: {
        from: 'trips.id',
        to: 'tripLinks.tripId',
      },
    },
    pictures: {
      relation: Document.HasManyRelation,
      modelClass: 'Picture',
      join: {
        from: 'trips.id',
        to: 'pictures.tripId',
      },
    },
    hazardRegions: {
      relation: Document.ManyToManyRelation,
      modelClass: 'HazardRegion',
      join: {
        from: 'trips.id',
        through: {
          modelClass: 'TripToHazardRegion',
          from: 'tripsToHazardRegions.tripId',
          to: 'tripsToHazardRegions.hazardRegionId',
        },
        to: 'hazardRegions.id',
      },
    },
    cabinsByDistance: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'trips.id',
        through: {
          modelClass: 'CabinToTripByDistance',
          extra: { calculatedDistance: 'calculatedDistance' },
          from: 'cabinsToTripsByDistance.tripId',
          to: 'cabinsToTripsByDistance.cabinId',
        },
        to: 'cabins.id',
      },
    },
    poisByDistance: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'trips.id',
        through: {
          modelClass: 'TripToPoiByDistance',
          extra: { calculatedDistance: 'calculatedDistance' },
          from: 'tripsToPoisByDistance.tripId',
          to: 'tripsToPoisByDistance.poiId',
        },
        to: 'pois.id',
      },
    },
    routesByDistance: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'trips.id',
        through: {
          modelClass: 'RouteToTripByDistance',
          extra: { calculatedDistance: 'calculatedDistance' },
          from: 'routesToTripsByDistance.tripId',
          to: 'routesToTripsByDistance.routeId',
        },
        to: 'routes.id',
      },
    },
    tripsByDistance: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'trips.id',
        through: {
          modelClass: 'TripToTripByDistance',
          extra: { calculatedDistance: 'calculatedDistance' },
          from: 'tripsToTripsByDistance.tripAId',
          to: 'tripsToTripsByDistance.tripBId',
        },
        to: 'trips.id',
      },
    },
  };


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'name',
      'suitableForChildren',
      'provider',
      'status',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { type: 'string', format: 'uuid', readOnly: true },
      idLegacyNtb: { type: 'string', readOnly: true, noApiReturn: true },
      activityType: { type: 'string', maxLength: 100 },
      name: { type: 'string', minLength: 2, maxLength: 100 },
      description: { type: 'string', maxLength: 100000 },
      url: { type: 'string', maxLength: 100 },
      grading: { ...gradingSchema },
      suitableForChildren: { type: 'boolean', default: false },
      distance: { type: 'number' },
      direction: { type: 'string', maxLength: 2, minLength: 2 },
      duration: {
        type: 'object',
        properties: {
          minutes: { type: 'number' },
          hours: { type: 'number' },
          days: { type: 'number' },
        },
      },
      startingPoint: { ...geojsonPointSchema },
      path: { ...geojsonLineStringSchema },
      pathPolyline: { type: 'string', readOnly: true },
      season: {
        type: 'array',
        items: [
          {
            type: 'number',
          },
        ],
      },
      htgt: {
        type: 'object',
        properties: {
          general: { type: 'string', maxLength: 1000 },
          winter: { type: 'string', format: 'email', maxLength: 1000 },
          summer: { type: 'string', maxLength: 1000 },
          publicTransport: { type: 'string', maxLength: 1000 },
          publicTransportAvailable: { type: 'boolean' },
          carAllYear: { type: 'boolean' },
          boatTransportAvailable: { type: 'boolean' },
          carSummer: { type: 'boolean' },
          bicycle: { type: 'boolean' },
        },
      },
      license: { type: 'string', maxLength: 300 },
      provider: { type: 'string', maxLength: 300, readOnly: true },
      status: { ...documentStatusSchema },
      updatedAt: { type: 'string', format: 'date', readOnly: true },
      createdAt: { type: 'string', format: 'date', readOnly: true },
    },
  };


  $parseDatabaseJson(databaseJson: { [P in keyof Trip]: Trip[P] }) {
    const json = super.$parseDatabaseJson(databaseJson);

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

    // Create htgt object
    json.htgt = {
      general: databaseJson.htgtGeneral,
      winter: databaseJson.htgtWinter,
      summer: databaseJson.htgtSummer,
      publicTransport: databaseJson.htgtPublicTransport,
      publicTransportAvailable: databaseJson.htgtPublicTransportAvailable,
      carAllYear: databaseJson.htgtCarAllYear,
      boatTransportAvailable: databaseJson.htgtBoatTransportAvailable,
      carSummer: databaseJson.htgtCarSummer,
      bicycle: databaseJson.htgtBicycle,
    };

    // Remove from databaseJson
    delete json.general;
    delete json.winter;
    delete json.summer;
    delete json.publicTransport;
    delete json.publicTransportAvailable;
    delete json.carAllYear;
    delete json.boatTransportAvailable;
    delete json.carSummer;
    delete json.bicycle;

    return json;
  }


  static apiEntryModel = true;

  static geometryAttributes = [
    'path',
    'startingPoint',
  ];


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
        idLegacyNtb: {
          type: 'text',
          filterTypes: ['=', '$in', '$nin'],
        },
        activityType: {
          type: 'text',
          filterTypes: ['=', 'null', 'notnull', '$in', '$nin'],
        },
        name: { type: 'text' },
        suitableForChildren: { type: 'boolean' },
        provider: {
          type: 'text',
          filterTypes: ['=', '$in', '$nin'],
        },
        distance: { type: 'number' },
        direction: {
          type: 'text',
          filterTypes: ['=', 'null', 'notnull'],
        },
        status: {
          type: 'text',
          filterTypes: ['=', '$in', '$nin'],
        },
        updatedAt: { type: 'date' },
        createdAt: { type: 'date' },
        'htgt.publicTransport': {
          type: 'boolean',
          tableAttribute: 'htgtPublicTransport',
        },
        'htgt.carAllYear': {
          type: 'boolean',
          tableAttribute: 'htgtCarAllYear',
        },
        'htgt.carSummer': {
          type: 'boolean',
          tableAttribute: 'htgtCarSummer',
        },
        'htgt.bicycle': {
          type: 'boolean',
          tableAttribute: 'htgtBicycle',
        },
        'htgt.publicTransportAvailable': {
          type: 'boolean',
          tableAttribute: 'htgtPublicTransportAvailable',
        },
        'htgt.boatTransportAvailable': {
          type: 'boolean',
          tableAttribute: 'htgtBoatTransportAvailable',
        },
      },
      fullFields: [
        'uri',
        'id',
        'name',
        'description',
        'url',
        'grading',
        'suitableForChildren',
        'distance',
        'direction',
        'duration',
        'season',
        'htgt',
        'license',
        'provider',
        'status',
        'updatedAt',
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
      defaultFields: [
        'uri',
        'id',
        'name',
      ],

      defaultRelations: [],
    };

    // Configuration when included through distance table
    const tripsByDistance: ApiConfig = {
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
      'Cabin.tripsByDistance': tripsByDistance,
      'Poi.tripsByDistance': tripsByDistance,
      'Trip.tripsByDistance': tripsByDistance,
    };
  }


  static getAPIFieldsToAttributes(referrers: string[], fields: string[]) {
    const extra = {
      duration: [
        'durationMinutes',
        'durationHours',
        'durationDays',
      ],
      htgt: [
        'htgtGeneral',
        'htgtWinter',
        'htgtSummer',
        'htgtPublicTransport',
        'htgtPublicTransportAvailable',
        'htgtCarAllYear',
        'htgtBoatTransportAvailable',
        'htgtCarSummer',
        'htgtBicycle',
      ],
      // Related extra field from Cabin++
      calculatedDistance: ['[[JOIN-TABLE]].calculatedDistance'],
    };

    const attributes = super.getAPIFieldsToAttributes(
      referrers, fields, extra,
    );

    return attributes;
  }
}

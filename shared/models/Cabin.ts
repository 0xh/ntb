import { geojson } from '@ntb/gis-utils';
import { RelationMappings, JsonSchema } from '@ntb/db-utils';

import {
  CabinOpeningHours,
} from './index';
import Document, {
  ApiConfigPerReferrer,
  ApiConfig,
  serviceLevel,
  documentStatus,
} from './Document';
import {
  documentStatusSchema,
  geojsonPointSchema,
  serviceLevelSchema,
} from './schemas';


export default class Cabin extends Document {
  static tableName = 'cabins';
  static idColumn = 'id';
  static idColumnType = 'uuid';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly id!: string;
  readonly idLegacyNtb?: string;
  idSsr?: string;
  dntCabin: boolean = false;
  dntDiscount: boolean = false;
  maintainerGroupId?: string;
  ownerGroupId?: string;
  contactGroupId?: string;
  name!: string;
  nameLowerCase!: string;
  nameAlt?: string[];
  nameAltLowerCase?: string[];
  description?: string;
  descriptionPlain?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  address1?: string;
  address2?: string;
  postalCode?: string;
  postalName?: string;
  url?: string;
  yearOfConstruction?: number;
  coordinates?: geojson.Point;
  countyId?: string;
  municipalityId?: string;
  serviceLevel!: serviceLevel;
  serviceLevelToday?: serviceLevel;
  bedsExtra: number = 0;
  bedsStaffed: number = 0;
  bedsSelfService: number = 0;
  bedsNoService: number = 0;
  bedsWinter: number = 0;
  bedsToday: number = 0;
  bookingEnabled: boolean = false;
  bookingOnly: boolean = false;
  bookingUrl?: string;
  htgtGeneral?: string;
  htgtWinter?: string;
  htgtSummer?: string;
  htgtPublicTransport?: boolean;
  htgtCarAllYear?: boolean;
  htgtCarSummer?: boolean;
  htgtBicycle?: boolean;
  htgtPublicTransportAvailable?: string;
  htgtBoatTransportAvailable?: string;
  map?: string;
  mapAlt?: string[];
  license?: string;
  provider!: string;
  status!: documentStatus;
  dataSource?: string;
  searchDocumentBoost?: number;
  createdAt!: Date;
  updatedAt!: Date;
  searchNb?: string;
  searchEn?: string;
  coordinatesUpdatedAt?: Date;
  processedRelationsUpdatedAt?: Date;
  processedElevationUpdatedAt?: Date;

  openingHours?: CabinOpeningHours[];
  // links
  // areas
  // facilities
  // accessabilities
  // ownerGroup
  // contactGroup
  // maintainerGroup
  // pictures
  // hazardRegions
  // routesByDistance
  // poisByDistance
  // tripsByDistance
  // cabinsByDistance

  get uri() {
    return `cabin/${this.id}`;
  }


  static relationMappings: RelationMappings = {
    openingHours: {
      relation: Document.HasManyRelation,
      modelClass: 'CabinOpeningHours',
      join: {
        from: 'cabins.id',
        to: 'cabinOpeningHours.cabinId',
      },
    },
    links: {
      relation: Document.HasManyRelation,
      modelClass: 'CabinLink',
      join: {
        from: 'cabins.id',
        to: 'cabinLinks.cabinId',
      },
    },
    areas: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Area',
      join: {
        from: 'cabins.id',
        through: {
          modelClass: 'CabinToArea',
          from: 'cabinsToAreas.cabinId',
          to: 'cabinsToAreas.areaId',
        },
        to: 'areas.id',
      },
    },
    facilities: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Facility',
      join: {
        from: 'cabins.id',
        through: {
          modelClass: 'CabinFacility',
          extra: { cabinFacilityDescription: 'description' },
          from: 'cabinFacilities.cabinId',
          to: 'cabinFacilities.facilityName',
        },
        to: 'facilities.name',
      },
    },
    accessabilities: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Accessability',
      join: {
        from: 'cabins.id',
        through: {
          modelClass: 'CabinAccessability',
          extra: { cabinAccessabilityDescription: 'description' },
          from: 'cabinAccessabilities.cabinId',
          to: 'cabinAccessabilities.accessabilityName',
        },
        to: 'accessabilities.name',
      },
    },
    ownerGroup: {
      relation: Document.BelongsToOneRelation,
      modelClass: 'Group',
      join: {
        from: 'cabins.ownerGroupId',
        to: 'groups.id',
      },
    },
    contactGroup: {
      relation: Document.BelongsToOneRelation,
      modelClass: 'Group',
      join: {
        from: 'cabins.contactGroupId',
        to: 'groups.id',
      },
    },
    maintainerGroup: {
      relation: Document.BelongsToOneRelation,
      modelClass: 'Group',
      join: {
        from: 'cabins.maintainerGroupId',
        to: 'groups.id',
      },
    },
    pictures: {
      relation: Document.HasManyRelation,
      modelClass: 'Picture',
      join: {
        from: 'cabins.id',
        to: 'pictures.cabinId',
      },
    },
    hazardRegions: {
      relation: Document.ManyToManyRelation,
      modelClass: 'HazardRegion',
      join: {
        from: 'cabins.id',
        through: {
          modelClass: 'CabinToHazardRegion',
          from: 'cabinsToHazardRegions.cabinId',
          to: 'cabinsToHazardRegions.hazardRegionId',
        },
        to: 'hazardRegions.id',
      },
    },
    routesByDistance: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'cabins.id',
        through: {
          modelClass: 'RouteToCabinByDistance',
          extra: { calculatedDistance: 'calculatedDistance' },
          from: 'routesToCabinsByDistance.cabinId',
          to: 'routesToCabinsByDistance.routeId',
        },
        to: 'routes.id',
      },
    },
    poisByDistance: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'cabins.id',
        through: {
          modelClass: 'CabinToPoiByDistance',
          extra: { calculatedDistance: 'calculatedDistance' },
          from: 'cabinsToPoisByDistance.cabinId',
          to: 'cabinsToPoisByDistance.poiId',
        },
        to: 'pois.id',
      },
    },
    tripsByDistance: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'cabins.id',
        through: {
          modelClass: 'CabinToTripByDistance',
          extra: { calculatedDistance: 'calculatedDistance' },
          from: 'cabinsToTripsByDistance.cabinId',
          to: 'cabinsToTripsByDistance.tripId',
        },
        to: 'trips.id',
      },
    },
    cabinsByDistance: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'cabins.id',
        through: {
          modelClass: 'CabinToCabinByDistance',
          extra: { calculatedDistance: 'calculatedDistance' },
          from: 'cabinsToCabinsByDistance.cabinAId',
          to: 'cabinsToCabinsByDistance.cabinBId',
        },
        to: 'cabins.id',
      },
    },
  };


  static geometryAttributes = [
    'coordinates',
  ];


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'dntCabin',
      'dntDiscount',
      'name',
      'provider',
      'status',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { type: 'string', format: 'uuid', readOnly: true },
      dntCabin: { type: 'boolean', default: false },
      dntDiscount: { type: 'boolean', default: false },
      name: { type: 'string', minLength: 2, maxLength: 100 },
      nameAlt: {
        type: 'array',
        items: {
          type: 'string',
          minLength: 2,
          maxLength: 100,
        },
      },
      description: { type: 'string', maxLength: 100000 },
      serviceLevel: { ...serviceLevelSchema },
      serviceLevelToday: { ...serviceLevelSchema },
      contact: {
        type: 'object',
        properties: {
          contactName: { type: 'string', maxLength: 100 },
          email: { type: 'string', format: 'email', maxLength: 100 },
          phone: { type: 'string', maxLength: 100 },
          mobile: { type: 'string', maxLength: 100 },
          fax: { type: 'string', maxLength: 100 },
          address1: { type: 'string', maxLength: 100 },
          address2: { type: 'string', maxLength: 100 },
          postalCode: { type: 'string', maxLength: 100 },
          postalName: { type: 'string', maxLength: 100 },
        },
      },
      beds: {
        type: 'object',
        properties: {
          extra: { type: 'number' },
          staffed: { type: 'number' },
          selfService: { type: 'number' },
          noService: { type: 'number' },
          winter: { type: 'number' },
          today: { type: 'number' },
        },
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
      url: { type: 'string', maxLength: 100 },
      yearOfConstruction: { type: 'string', maxLength: 100 },
      coordinates: { ...geojsonPointSchema },
      map: { type: 'string', maxLength: 300 },
      mapAlt: { type: 'array', items: { type: 'string', maxLength: 400 } },
      license: { type: 'string', maxLength: 300 },
      provider: { type: 'string', maxLength: 300, readOnly: true },
      status: { ...documentStatusSchema },
      updatedAt: { type: 'string', format: 'date', readOnly: true },
      createdAt: { type: 'string', format: 'date', readOnly: true },
    },
  };


  $parseDatabaseJson(databaseJson: { [P in keyof Cabin]: Cabin[P] }) {
    const json = super.$parseDatabaseJson(databaseJson);

    // Create contact object
    json.contact = {
      name: databaseJson.contactName,
      email: databaseJson.email,
      phone: databaseJson.phone,
      mobile: databaseJson.mobile,
      fax: databaseJson.fax,
      address1: databaseJson.address1,
      address2: databaseJson.address2,
      postalCode: databaseJson.postalCode,
      postalName: databaseJson.postalName,
    };

    // Remove from databaseJson
    delete json.contactName;
    delete json.email;
    delete json.phone;
    delete json.mobile;
    delete json.fax;
    delete json.address1;
    delete json.address2;
    delete json.postalCode;
    delete json.postalName;

    // Create beds object
    json.beds = {
      extra: databaseJson.bedsExtra || null,
      staffed: databaseJson.bedsStaffed || null,
      selfService: databaseJson.bedsSelfService || null,
      noService: databaseJson.bedsNoService || null,
      winter: databaseJson.bedsWinter || null,
      today: databaseJson.bedsToday || null,
    };

    // Remove from databaseJson
    delete json.bedsExtra;
    delete json.bedsStaffed;
    delete json.bedsSelfService;
    delete json.bedsNoService;
    delete json.bedsWinter;
    delete json.bedsToday;

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

    // Remove empty cabinFacilityDescription
    if (
      !json.cabinFacilityDescription
      || json.cabinFacilityDescription.trim() === ''
    ) {
      json.cabinFacilityDescription = null;
    }

    return json;
  }


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
      translated: true,
      translatedFields: [
        'name',
        'nameLowerCase',
        'description',
        'descriptionPlain',
      ],
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
        dntCabin: { type: 'boolean' },
        dntDiscount: { type: 'boolean' },
        serviceLevel: {
          type: 'text',
          filterTypes: ['=', 'null', 'notnull', '$in', '$nin'],
        },
        serviceLevelToday: {
          type: 'text',
          filterTypes: ['=', 'null', 'notnull', '$in', '$nin'],
        },
        name: { type: 'text' },
        provider: {
          type: 'text',
          filterTypes: ['=', '$in', '$nin'],
        },
        status: {
          type: 'text',
          filterTypes: ['=', '$in', '$nin'],
        },
        coordinates: {
          type: 'geojson',
          geojsonType: 'Point',
        },
        updatedAt: { type: 'date' },
        createdAt: { type: 'date' },
        'beds.today': {
          type: 'number',
          tableAttribute: 'bedsToday',
        },
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
        'nameAlt',
        'description',
        'serviceLevel',
        'serviceLevelToday',
        'contact',
        'map',
        'url',
        'license',
        'provider',
        'status',
        'updatedAt',
        'beds',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [
        'openingHours',
        'links',
        'ownerGroup',
        'contactGroup',
        'maintainerGroup',
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

    // Configuration when included through Accessability.cabins
    const accessabilityCabins: ApiConfig = {
      ...standard,
      defaultFields: [
        ...(standard.defaultFields || []),
        'cabinAccessabilityDescription',
      ],
    };

    // Configuration when included through Facility.cabins
    const facilityCabins: ApiConfig = {
      ...standard,
      defaultFields: [
        ...(standard.defaultFields || []),
        'cabinFacilityDescription',
      ],
    };

    // Configuration when included through
    // DabinServiceLevel.cabinsThroughOpeningHours
    const cabinServiceLevelCabinsThroughOpeningHours: ApiConfig = {
      ...standard,
      defaultFields: [
        ...(standard.defaultFields || []),
        'openAllYear',
        'openFrom',
        'openTo',
      ],
    };

    // Configuration when included through distance table
    const cabinsByDistance: ApiConfig = {
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
      'Accessability.cabins': accessabilityCabins,
      'Facility.cabins': facilityCabins,
      'CabinServiceLevel.cabinsThroughOpeningHours':
        cabinServiceLevelCabinsThroughOpeningHours,
      'Route.cabinsByDistance': cabinsByDistance,
      'Poi.cabinsByDistance': cabinsByDistance,
      'Trip.cabinsByDistance': cabinsByDistance,
      'Cabin.cabinsByDistance': cabinsByDistance,
    };
  }


  static getAPIFieldsToAttributes(referrers: string[], fields: string[]) {
    const extra = {
      // Related extra field from Accessability
      cabinAccessabilityDescription: [
        '[[JOIN-TABLE]].cabinAccessabilityDescription',
      ],

      // Related extra field from Facility
      cabinFacilityDescription: ['[[JOIN-TABLE]].cabinFacilityDescription'],

      // Related extra field through cabinsByDistance
      calculatedDistance: ['[[JOIN-TABLE]].calculatedDistance'],

      // Related extra fields from DabinServiceLevel.cabinsThroughOpeningHours
      openAllYear: ['[[JOIN-TABLE]].openAllYear'],
      openFrom: ['[[JOIN-TABLE]].openFrom'],
      openTo: ['[[JOIN-TABLE]].openTo'],

      contact: [
        'contactName',
        'email',
        'phone',
        'mobile',
        'fax',
        'address1',
        'address2',
        'postalCode',
        'postalName',
      ],
      beds: [
        'bedsExtra',
        'bedsStaffed',
        'bedsSelfService',
        'bedsNoService',
        'bedsWinter',
        'bedsToday',
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
    };

    const attributes = super.getAPIFieldsToAttributes(
      referrers, fields, extra,
    );

    return attributes;
  }
}

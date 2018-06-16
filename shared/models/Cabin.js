import BaseModel from './BaseModel';
import DocumentStatusSchema from './schemas/document-status';


export default class Cabin extends BaseModel {
  static tableName = 'cabins';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];


  get uri() {
    return `cabin/${this.id}`;
  }


  static relationMappings = {
    openingHours: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'CabinOpeningHours',
      join: {
        from: 'cabins.id',
        to: 'cabinOpeningHours.cabinId',
      },
    },
    links: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'CabinLink',
      join: {
        from: 'cabins.id',
        to: 'cabinLinks.cabinId',
      },
    },
    areas: {
      relation: BaseModel.ManyToManyRelation,
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
      relation: BaseModel.ManyToManyRelation,
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
      relation: BaseModel.ManyToManyRelation,
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
      relation: BaseModel.BelongsToOneRelation,
      modelClass: 'Group',
      join: {
        from: 'cabins.ownerGroupId',
        to: 'groups.id',
      },
    },
    contactGroup: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: 'Group',
      join: {
        from: 'cabins.contactGroupId',
        to: 'groups.id',
      },
    },
    maintainerGroup: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: 'Group',
      join: {
        from: 'cabins.maintainerGroupId',
        to: 'groups.id',
      },
    },
    pictures: {
      relation: BaseModel.HasManyRelation,
      modelClass: 'Picture',
      join: {
        from: 'cabins.id',
        to: 'pictures.cabinId',
      },
    },
  };


  static geometryAttributes = [
    'coordinates',
  ];


  static jsonSchema = {
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
      idLegacyNtb: { type: 'string', readOnly: true, noApiReturn: true },
      dntCabin: { type: 'boolean', default: false },
      dntDiscount: { type: 'boolean', default: false },
      name: { type: 'string', minLength: 2, maxLength: 100 },
      nameAlt: {
        type: 'array',
        items: [
          {
            type: 'string',
            minLength: 2,
            maxLength: 100,
          },
        ],
      },
      description: { type: 'string', maxLength: 100000 },
      serviceLevel: { type: 'string' },
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
      coordinates: { type: 'object' },
      map: { type: 'string', maxLength: 300 },
      mapAlt: { type: 'array', items: [{ type: 'string', maxLength: 400 }] },
      license: { type: 'string', maxLength: 300 },
      provider: { type: 'string', maxLength: 300, readOnly: true },
      status: { ...DocumentStatusSchema },
      updatedAt: { type: 'string', format: 'date', readOnly: true },
      createdAt: { type: 'string', format: 'date', readOnly: true },
    },
  };


  $parseDatabaseJson(databaseJson) {
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


  static APIEntryModel = true;


  static getAPIConfig() {
    const config = {};

    // Configuration when it's the entry model
    config['*list'] = {
      paginate: true,
      fullTextSearch: true,
      ordering: true,

      defaultLimit: 10,
      maxLimit: 50,
      validOrderFields: [
        'name',
        'updatedAt',
        'createdAt',
      ],
      defaultOrder: [['name', 'ASC']],
      validFilters: {
        id: {},
        idLegacyNtb: { filterTypes: ['=', 'null', 'notnull', '$in', '$nin'] },
        dntCabin: {},
        dntDiscount: {},
        serviceLevel: { filterTypes: ['=', 'null', 'notnull', '$in', '$nin'] },
        name: {},
        provider: { filterTypes: ['=', '$in', '$nin'] },
        status: { filterTypes: ['=', '$in', '$nin'] },
        coordinates: {
          geojsonType: 'point',
        },
        updatedAt: {},
        createdAt: {},
      },
      fullFields: [
        'uri',
        'id',
        'name',
        'nameAlt',
        'description',
        'serviceLevel',
        'contact',
        'map',
        'url',
        'license',
        'provider',
        'status',
        'updatedAt',
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
    config['*single'] = config['*list'];

    // Default configuration when included from another model
    config.default = {
      ...config['*list'],
      defaultFields: [
        'uri',
        'id',
        'name',
      ],

      defaultRelations: [],
    };

    // Configuration when included through Accessability.cabins
    config['Accessability.cabins'] = {
      ...config.default,
      defaultFields: [
        ...config.default.defaultFields,
        'cabinAccessabilityDescription',
      ],
    };

    // Configuration when included through Facility.cabins
    config['Facility.cabins'] = {
      ...config.default,
      defaultFields: [
        ...config.default.defaultFields,
        'cabinFacilityDescription',
      ],
    };

    // Configuration when included through
    // DabinServiceLevel.cabinsThroughOpeningHours
    config['CabinServiceLevel.cabinsThroughOpeningHours'] = {
      ...config.default,
      defaultFields: [
        ...config.default.defaultFields,
        'openAllYear',
        'openFrom',
        'openTo',
      ],
    };

    return config;
  }


  static getAPIFieldsToAttributes(referrer, fields) {
    const extra = {
      // Related extra field from Accessability
      cabinAccessabilityDescription: ['cabinAccessabilityDescription'],

      // Related extra field from Facility
      cabinFacilityDescription: ['cabinFacilityDescription'],

      // Related extra fields from DabinServiceLevel.cabinsThroughOpeningHours
      openAllYear: ['openAllYear'],
      openFrom: ['openFrom'],
      openTo: ['openTo'],

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

    const attributes = super.getAPIFieldsToAttributes(referrer, fields, extra);

    return attributes;
  }
}

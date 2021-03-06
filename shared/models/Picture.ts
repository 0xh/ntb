import { geojson } from '@ntb/gis-utils';
import { RelationMappings, JsonSchema } from '@ntb/db-utils';

import Document, {
  ApiConfigPerReferrer,
  ApiConfig,
  documentStatus,
} from './Document';
import {
  documentStatusSchema,
  geojsonPointSchema,
  cabinPictureTypeSchema,
} from './schemas';
import { cabinPictureType } from './CabinPictureType';


export default class Picture extends Document {
  static tableName = 'pictures';
  static idColumn = 'id';
  static idColumnType = 'uuid';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly id!: string;
  readonly idLegacyNtb?: string;
  areaId?: string;
  cabinId?: string;
  listId?: string;
  poiId?: string;
  routeId?: string;
  tripId?: string;
  sortIndex?: number;
  cabinPictureType?: cabinPictureType;
  photographerName?: string;
  photographerEmail?: string;
  photographerCredit?: string;
  description?: string;
  coordinates?: geojson.Point;
  original?: { [key: string]: any };
  exif?: { [key: string]: any };
  versions?: { [key: string]: any };
  license?: string;
  provider!: string;
  legacyFirstTag?: string;
  legacyFirstTags?: string[];
  status!: documentStatus;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;


  get uri() {
    return `picture/${this.id}`;
  }


  static relationMappings: RelationMappings = {
    // TODO
    // list

    area: {
      relation: Document.BelongsToOneRelation,
      modelClass: 'Area',
      join: {
        from: 'pictures.areaId',
        to: 'areas.id',
      },
    },
    cabin: {
      relation: Document.BelongsToOneRelation,
      modelClass: 'Cabin',
      join: {
        from: 'pictures.cabinId',
        to: 'cabins.id',
      },
    },
    poi: {
      relation: Document.BelongsToOneRelation,
      modelClass: 'Poi',
      join: {
        from: 'pictures.poiId',
        to: 'pois.id',
      },
    },
    route: {
      relation: Document.BelongsToOneRelation,
      modelClass: 'Route',
      join: {
        from: 'pictures.routeId',
        to: 'routes.id',
      },
    },
    trip: {
      relation: Document.BelongsToOneRelation,
      modelClass: 'Trip',
      join: {
        from: 'pictures.tripId',
        to: 'trips.id',
      },
    },
  };


  static geometryAttributes = [
    'coordinates',
  ];


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'provider',
      'status',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { type: 'string', format: 'uuid', readOnly: true },
      idLegacyNtb: { type: 'string', readOnly: true },
      cabinPictureType: { ...cabinPictureTypeSchema },
      photographer: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          credit: { type: 'string' },
        },
      },
      description: { type: 'string' },
      coordinates: { ...geojsonPointSchema },
      original: {
        type: 'object',
        properties: {
          sha1: { type: 'string' },
          size: { type: 'string' },
          width: { type: 'number' },
          format: { type: 'string' },
          height: { type: 'number' },
          colorspace: { type: 'string' },
        },
      },
      exif: {
        type: 'object',
        properties: {
          artist: { type: 'string' },
          imageDescription: { type: 'string' },
          copyright: { type: 'string' },
          model: { type: 'string' },
          dateTimeDigitized: { type: 'string' },
          software: { type: 'string' },
          dateTime: { type: 'string' },
          make: { type: 'string' },
          documentName: { type: 'string' },
        },
      },
      versions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            quality: { type: 'number' },
            etag: { type: 'string' },
            url: { type: 'string' },
            height: { type: 'number' },
            width: { type: 'number' },
          },
        },
      },
      license: { type: 'string', maxLength: 300 },
      provider: { type: 'string', maxLength: 300, readOnly: true },
      status: { ...documentStatusSchema },
      updatedAt: { type: 'string', format: 'date', readOnly: true },
      createdAt: { type: 'string', format: 'date', readOnly: true },
    },
  };


  $parseDatabaseJson(databaseJson: { [P in keyof Picture]: Picture[P] }) {
    const json = super.$parseDatabaseJson(databaseJson);

    // Create photographer object
    json.photographer = {
      name: databaseJson.photographerName,
      email: databaseJson.photographerEmail,
      credit: databaseJson.photographerCredit,
    };

    // Remove from databaseJson
    delete json.photographerName;
    delete json.photographerEmail;
    delete json.photographerCredit;

    return json;
  }


  static apiEntryModel = true;

  static getApiConfigPerReferrer(): ApiConfigPerReferrer {
    // Configuration when it's the entry model
    const list: ApiConfig = {
      paginate: {
        maxLimit: 50,
        defaultLimit: 10,
      },
      fullTextSearch: true,
      ordering: {
        validFields: [
          'sortIndex',
          'updatedAt',
          'createdAt',
        ],
        default: [['updatedAt', 'DESC']],
      },
      filters: {
        id: { type: 'uuid' },
        idLegacyNtb: {
          type: 'text',
          filterTypes: ['=', '$in', '$nin'],
        },
        cabinPictureType: {
          type: 'text',
          caseInsensitive: true,
          filterTypes: ['=', '$in', '$nin'],
        },
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
        'cabinPictureType',
        'photographer',
        'description',
        'coordinates',
        'original',
        'exif',
        'versions',
        'license',
        'provider',
        'status',
        'updatedAt',
      ],
      defaultFields: [
        'uri',
        'id',
        'cabinPictureType',
        'photographer',
        'description',
        'coordinates',
        'versions',
        'license',
        'provider',
        'status',
        'updatedAt',
      ],
      defaultRelations: [],
    };

    // Default configuration when included from another model
    const single: ApiConfig = {
      ...list,
      defaultRelations: [
        'area',
        'cabin',
        'poi',
        'trip',
        'route',
      ],
    };

    // Default configuration when included from another model
    const standard: ApiConfig = {
      ...list,
      ordering: {
        validFields: [
          'sortIndex',
          'updatedAt',
          'createdAt',
        ],
        default: [['sortIndex', 'ASC']],
      },
      defaultFields: [
        'uri',
        'id',
        'versions',
        'cabinPictureType',
        'description',
        'photographer',
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
    const extra = {
      photographer: [
        'photographerName',
        'photographerEmail',
        'photographerCredit',
      ],
    };

    const attributes = super.getAPIFieldsToAttributes(
      referrers, fields, extra,
    );

    return attributes;
  }
}

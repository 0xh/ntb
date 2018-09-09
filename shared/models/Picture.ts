import { geojson } from '@ntb/gis-utils';
import { RelationMappings, JsonSchema } from '@ntb/db-utils';

import Document, {
  apiConfigPerReferrer,
  apiConfig,
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
      id: { format: 'uuid', readOnly: true },
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
      original: { type: 'object' },
      exif: { type: 'object' },
      versions: { type: 'object' },
      license: { type: 'string', maxLength: 300 },
      provider: { type: 'string', maxLength: 300, readOnly: true },
      status: { ...documentStatusSchema },
      updatedAt: { format: 'date', readOnly: true },
      createdAt: { format: 'date', readOnly: true },
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

  static getApiConfigPerReferrer(): apiConfigPerReferrer {
    // Configuration when it's the entry model
    const list: apiConfig = {
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
        id: {},
        idLegacyNtb: {},
        name: {},
        provider: { filterTypes: ['=', '$in', '$nin'] },
        status: { filterTypes: ['=', '$in', '$nin'] },
        updatedAt: {},
        createdAt: {},
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
    const single: apiConfig = {
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
    const standard: apiConfig = {
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

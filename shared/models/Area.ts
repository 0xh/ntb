import { geojson } from '@ntb/gis-utils';
import { RelationMappings, JsonSchema } from '@ntb/db-utils';

import Document, {
  ApiConfigPerReferrer,
  ApiConfig,
  documentStatus,
} from './Document';
import { documentStatusSchema, geojsonPolygonSchema } from './schemas';


export default class Area extends Document {
  static tableName = 'areas';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly id!: string;
  readonly idLegacyNtb?: string;
  name!: string;
  nameLowerCase!: string;
  description?: string;
  descriptionPlain?: string;
  geometry?: geojson.Polygon;
  map?: string;
  url?: string;
  license?: string;
  provider!: string;
  status!: documentStatus;
  dataSource?: string;
  searchDocumentBoost?: number;
  searchNb?: string;
  createdAt!: Date;
  updatedAt!: Date;
  geometryUpdatedAt?: Date;
  processedRelationsUpdatedAt?: Date;


  get uri() {
    return `area/${this.id}`;
  }


  static relationMappings: RelationMappings = {
    children: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Area',
      join: {
        from: 'areas.id',
        through: {
          modelClass: 'AreaToArea',
          from: 'areasToAreas.parentId',
          to: 'areasToAreas.childId',
        },
        to: 'areas.id',
      },
    },
    parents: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Area',
      join: {
        from: 'areas.id',
        through: {
          modelClass: 'AreaToArea',
          from: 'areasToAreas.childId',
          to: 'areasToAreas.parentId',
        },
        to: 'areas.id',
      },
    },
    counties: {
      relation: Document.ManyToManyRelation,
      modelClass: 'County',
      join: {
        from: 'areas.id',
        through: {
          modelClass: 'AreaToCounty',
          from: 'areasToCounties.areaId',
          to: 'areasToCounties.countyId',
        },
        to: 'counties.id',
      },
    },
    municipalities: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Municipality',
      join: {
        from: 'areas.id',
        through: {
          modelClass: 'AreaToMunicipality',
          from: 'areasToMunicipalities.areaId',
          to: 'areasToMunicipalities.municipalityId',
        },
        to: 'municipalities.id',
      },
    },
    cabins: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'areas.id',
        through: {
          modelClass: 'CabinToArea',
          from: 'cabinsToAreas.areaId',
          to: 'cabinsToAreas.cabinId',
        },
        to: 'cabins.id',
      },
    },
    pois: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'areas.id',
        through: {
          modelClass: 'PoiToArea',
          from: 'poisToAreas.areaId',
          to: 'poisToAreas.poiId',
        },
        to: 'pois.id',
      },
    },
    routes: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'areas.id',
        through: {
          modelClass: 'RouteToArea',
          from: 'routesToAreas.areaId',
          to: 'routesToAreas.routeId',
        },
        to: 'routes.id',
      },
    },
    trips: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'areas.id',
        through: {
          modelClass: 'TripToArea',
          from: 'tripsToAreas.areaId',
          to: 'tripsToAreas.tripId',
        },
        to: 'trips.id',
      },
    },
    pictures: {
      relation: Document.HasManyRelation,
      modelClass: 'Picture',
      join: {
        from: 'areas.id',
        to: 'pictures.areaId',
      },
    },
    hazardRegions: {
      relation: Document.ManyToManyRelation,
      modelClass: 'HazardRegion',
      join: {
        from: 'areas.id',
        through: {
          modelClass: 'AreaToHazardRegion',
          from: 'areasToHazardRegions.areaId',
          to: 'areasToHazardRegions.hazardRegionId',
        },
        to: 'hazardRegions.id',
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
      'provider',
      'status',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { type: 'string', format: 'uuid', readOnly: true },
      idLegacyNtb: { type: 'string', readOnly: true },
      name: { type: 'string', minLength: 2, maxLength: 100 },
      description: { type: 'string', maxLength: 100000 },
      geometry: { ...geojsonPolygonSchema },
      map: { type: 'string', maxLength: 300 },
      url: { type: 'string', maxLength: 300 },
      license: { type: 'string', maxLength: 300 },
      provider: { type: 'string', maxLength: 300, readOnly: true },
      status: { ...documentStatusSchema },
      updatedAt: { format: 'date', readOnly: true },
      createdAt: { format: 'date', readOnly: true },
    },
  };

  static apiEntryModel = true;

  static getApiConfigPerReferrer(): ApiConfigPerReferrer {
    const list: ApiConfig = {
      fullTextSearch: true,
      paginate: {
        defaultLimit: 10,
        maxLimit: 50,
      },
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
        name: { type: 'text' },
        provider: {
          type: 'text',
          filterTypes: ['=', '$in', '$nin'],
        },
        geometry: {
          type: 'geojson',
          geojsonType: 'Polygon',
        },
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
        'name',
        'description',
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
      '*single': single,
      '*list': list,
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

import { RelationMappings, JsonSchema } from '@ntb/db-utils';

import Document, {
  ApiConfigPerReferrer,
  ApiConfig,
  documentStatus,
} from './Document';
import { documentStatusSchema } from './schemas';


export default class Group extends Document {
  static tableName = 'groups';
  static idColumn = 'id';
  static idColumnType = 'uuid';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly id!: string;
  readonly idLegacyNtb?: string;
  groupType!: string;
  groupSubType?: string;
  municipalityId?: string;
  name!: string;
  nameLowerCase!: string;
  description?: string;
  descriptionPlain?: string;
  logo?: string;
  organizationNumber?: string;
  url?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  address1?: string;
  address2?: string;
  postalCode?: string;
  postalName?: string;
  license?: string;
  provider!: string;
  status!: documentStatus;
  dataSource?: string;
  searchDocumentBoost?: number;
  searchNb?: number;
  createdAt!: Date;
  updatedAt!: Date;


  get uri() {
    return `group/${this.id}`;
  }


  static relationMappings: RelationMappings = {
    // TODO(Roar):
    // lists

    ownsCabins: {
      relation: Document.HasManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'groups.id',
        to: 'cabins.ownerGroupId',
      },
    },
    isContactForCabins: {
      relation: Document.HasManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'groups.id',
        to: 'cabins.contactGroupId',
      },
    },
    maintainesCabins: {
      relation: Document.HasManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'groups.id',
        to: 'cabins.maintainerGroupId',
      },
    },
    municipality: {
      relation: Document.BelongsToOneRelation,
      modelClass: 'Municipality',
      join: {
        from: 'groups.municipality_id',
        to: 'municipalities.id',
      },
    },
    pois: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Poi',
      join: {
        from: 'groups.id',
        through: {
          modelClass: 'PoiToGroup',
          from: 'poisToGroups.groupId',
          to: 'poisToGroups.poiId',
        },
        to: 'pois.id',
      },
    },
    links: {
      relation: Document.HasManyRelation,
      modelClass: 'GroupLink',
      join: {
        from: 'groups.id',
        to: 'groupLinks.groupId',
      },
    },
    trips: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Trip',
      join: {
        from: 'groups.id',
        through: {
          modelClass: 'TripToGroup',
          from: 'tripsToGroups.groupId',
          to: 'tripsToGroups.tripId',
        },
        to: 'trips.id',
      },
    },
    routes: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Route',
      join: {
        from: 'groups.id',
        through: {
          modelClass: 'RouteToGroup',
          from: 'routesToGroups.groupId',
          to: 'routesToGroups.routeId',
        },
        to: 'routes.id',
      },
    },
  };


  static jsonSchema: JsonSchema = {
    type: 'object',
    required: [
      'name',
    ],

    properties: {
      uri: { type: 'string', readOnly: true },
      id: { type: 'string', format: 'uuid' },
      idLegacyNtb: { type: 'string', readOnly: true, noApiReturn: true },
      groupType: { type: 'string' },
      groupSubType: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      logo: { type: 'string' },
      organizationNumber: { type: 'string' },
      url: { type: 'string' },
      email: { type: 'string' },
      phone: { type: 'string' },
      mobile: { type: 'string' },
      fax: { type: 'string' },
      address1: { type: 'string' },
      address2: { type: 'string' },
      postalCode: { type: 'string' },
      postalName: { type: 'string' },
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
      ordering: {
        default: [['name', 'ASC']],
        validFields: [
          'name',
          'updatedAt',
          'createdAt',
        ],
      },
      fullFields: [
        'uri',
        'id',
        'type',
        'subType',
        'name',
        'description',
        'logo',
        'organizationNumber',
        'url',
        'email',
        'phone',
        'mobile',
        'fax',
        'address1',
        'address2',
        'postalCode',
        'postalName',
        'license',
        'provider',
        'status',
        'updatedAt',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [
        'links',
      ],
      filters: {
        id: { type: 'uuid' },
        idLegacyNtb: {
          type: 'text',
          filterTypes: ['=', '$in', '$nin'],
        },
        groupType: {
          type: 'text',
          caseInsensitive: true,
          filterTypes: ['=', '$in', '$nin'],
        },
        groupSubType: {
          type: 'text',
          caseInsensitive: true,
          filterTypes: ['=', '$in', '$nin'],
        },
        name: {
          type: 'text',
          tableAttribute: 'nameLowerCase',
          caseInsensitive: true,
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

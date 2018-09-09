import { RelationMappings, JsonSchema } from '@ntb/db-utils';

import Document, {
  apiConfigPerReferrer,
  apiConfig,
} from './Document';


export default class Facility extends Document {
  static tableName = 'facilities';
  static idColumn = 'name';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly name!: string;
  description?: string;

  static modelDescription = `
    Facilities are related to Cabins and describes what kind of amenities
    the given Cabin has.

    You can use the /facility endpoint to list the valid and available
    facilities. Which facilities are available can be changed in the future,
    and is controlled by the Nasjonal Turbase admins, mainly DNT.
  `;

  get uri() {
    return `facility/${this.name}`;
  }


  static relationMappings: RelationMappings = {
    cabins: {
      relation: Document.ManyToManyRelation,
      modelClass: 'Cabin',
      join: {
        from: 'facilities.name',
        through: {
          modelClass: 'CabinFacility',
          extra: { cabinFacilityDescription: 'description' },
          from: 'cabinFacilities.facilityName',
          to: 'cabinFacilities.cabinId',
        },
        to: 'cabins.id',
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
      name: { type: 'string' },
      description: { type: 'string' },
    },
  };


  $parseDatabaseJson(databaseJson: { [P in keyof Facility]: Facility[P] }) {
    const json = super.$parseDatabaseJson(databaseJson);

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

  static getApiConfigPerReferrer(): apiConfigPerReferrer {
    // Configuration when it's the entry model
    const list: apiConfig = {
      paginate: false,
      fullTextSearch: false,
      ordering: {
        default: [['name', 'ASC']],
        validFields: ['name'],
      },
      filters: {
        name: { filterTypes: ['=', '$in', '$nin'] },
      },
      fullFields: [
        'name',
        'description',
      ],
      defaultFields: [
        '*full',
      ],
      defaultRelations: [],
    };

    // Default configuration when an instance in accessed directly
    const single: apiConfig = list;

    // Default configuration when included from another model
    const standard: apiConfig = {
      ...list,
      defaultFields: ['name'],
    };

    // Configuration when included through Cabin.facilities
    const cabinFacilities: apiConfig = {
      ...standard,
      defaultFields: [
        ...(standard.defaultFields || []),
        'cabinFacilityDescription',
      ],
    };

    return {
      standard,
      '*list': list,
      '*single': single,
      'Cabin.facilities': cabinFacilities,
    };
  }


  static getAPIFieldsToAttributes(referrers: string[], fields: string[]) {
    const extra = {
      // Related extra field from Cabin
      cabinFacilityDescription: ['cabinFacilityDescription'],
    };

    const attributes = super.getAPIFieldsToAttributes(
      referrers, fields, extra,
    );

    return attributes;
  }
}

import ajvKeywords from 'ajv-keywords';

import { _, moment } from '@ntb/utils';
import {
  Model,
  AjvValidator,
  RelationMappings,
  JsonSchema,
} from '@ntb/db-utils';


export type documentType =
  | 'cabinOpeningHours'
  | 'tripLink'
  | 'list'
  | 'hazardRegion'
  | 'poiLink'
  | 'countyTranslation'
  | 'group'
  | 'municipality'
  | 'cabinTranslation'
  | 'cabinLink'
  | 'route'
  | 'municipalityTranslation'
  | 'groupLink'
  | 'area'
  | 'county'
  | 'routeLink'
  | 'listLink'
  | 'picture'
  | 'cabin'
  | 'trip'
  | 'poi';

export type serviceLevel =
  | 'self-service'
  | 'staffed'
  | 'no-service'
  | 'closed'
  | 'food service'
  | 'no-service (no beds)'
  | 'emergency shelter';

export type documentStatus =
  | 'draft'
  | 'public'
  | 'deleted'
  | 'private';

export type linkType =
  | 'price'
  | 'weather'
  | 'video'
  | 'booking'
  | 'homepage'
  | 'facebook'
  | 'twitter'
  | 'instagram'
  | 'contact info'
  | 'other';

export type grading =
  | 'easy'
  | 'moderate'
  | 'tough'
  | 'very tough'
  | 'moderate';

type orderField = [string, 'ASC' | 'DESC'];
type filterType =
  | '='
  | '$gt'
  | '$gte'
  | '$lt'
  | '$lte'
  | 'null'
  | 'notnull'
  | '$in'
  | '$nin';

export interface apiFilters {
  [key: string]: {
    type?: 'string' | 'number' | 'uuid' | 'boolean' | 'date',
    filterTypes?: filterType[],
    geojsonType?: 'Point' | 'LineString',
  },
};

export interface apiConfig {
  fullTextSearch?: boolean;
  fullTextSearchLangauges?: string[],
  translated?: boolean,
  translatedFields?: string[],
  ordering?: false | {
    disabled?: boolean,
    default: orderField[],
    validFields: string[],
  };
  paginate?: false | {
    disabled?: boolean,
    defaultLimit: number,
    maxLimit: number,
  };
  filters?: false | apiFilters;
  fullFields?: string[];
  defaultFields?: string[];
  defaultRelations?: string[];
}

export interface apiConfigJoinTable {
  ordering?: {
    validFields: string[],
  };
  filters?: apiFilters;
}

export interface apiConfigPerReferrer {
  standard: apiConfig;
  [key: string]: apiConfig;
}


export default abstract class Document extends Model {
  static modelPaths = [__dirname];
  static idColumn: string | string[];

  timestamps?: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  static modelDescription: string;
  static jsonSchema: JsonSchema;
  static relationMappings: RelationMappings | (() => RelationMappings);
  static apiEntryModel: boolean = false;
  static geometryAttributes: string[] = [];
  static apiConfig?: apiConfigJoinTable;

  static getApiConfigPerReferrer(): apiConfigPerReferrer {
    return { standard: { } };
  }

  static getApiConfig(referrers?: string[]): apiConfig {
    const apiConfigPerReferrer = this.getApiConfigPerReferrer();
    let selectedApiConfig = apiConfigPerReferrer.standard;

    if (referrers) {
      referrers.some((referrer) => {
        if (apiConfigPerReferrer[referrer]) {
          selectedApiConfig = apiConfigPerReferrer[referrer];
          return true;
        }
        return false;
      });
    }

    return selectedApiConfig;
  }

  static getBaseFields(
    referrers: string[],
    includeNoReturn = false,
  ): string[] {
    const schema = this.jsonSchema || {};
    const properties = schema.properties || {};
    return Object.keys(properties)
      .filter((f) => {
        const filter = properties[f];

        if (filter.noApiReturn && !includeNoReturn) {
          return false;
        }

        if (!filter.availableForReferrers) {
          return true;
        }

        const availableForReferrers = filter.availableForReferrers || [];
        return referrers
          .some((referrer) => availableForReferrers.includes(referrer));
      });
  }

  static getAPIFieldsToAttributes(
    referrers: string[],
    fields: string[],
    extra: { [key: string]: string[] } = {},
  ) {
    const attrs = this.getBaseFields(referrers, true);
    const nestedAttributes = fields
      .map((field) => {
        if (field === 'uri') {
          return null;
        }
        if (extra[field]) {
          return extra[field];
        }
        if (attrs.includes(field)) {
          return [field];
        }
        return null;
      })
      .filter((field):field is string[] => field !== null);
    const attributes = _.flatten(nestedAttributes);

    return attributes;
  }

  static createValidator() {
    const validator = new AjvValidator({
      onCreateAjv: (ajv) => {
        ajvKeywords(ajv);
      },
    });

    return validator;
  }

  $parseDatabaseJson(databaseJson: { [key: string]: any }) {
    const json = super.$parseDatabaseJson(databaseJson);

    // Format dates to ISO 8601
    Object.keys(json).forEach((key) => {
      if (json[key] instanceof Date) {
        json[key] = moment(json[key]).toISOString();
      }
    });

    return json;
  }

  $beforeInsert() {
    if (this.timestamps) {
      this.createdAt = new Date();
      this.updatedAt = new Date();
    }
  }

  $beforeUpdate() {
    if (this.timestamps) {
      this.updatedAt = new Date();
    }
  }
}

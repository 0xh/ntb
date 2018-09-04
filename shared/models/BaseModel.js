import moment from 'moment';

import { Model, AjvValidator } from '@ntb/shared-db-utils';

import geojsonPolygonSchema from './schemas/geojson-polygon';
import documentStatusSchema from './schemas/document-status';


export default class BaseModel extends Model {
  static modelPaths = [__dirname];

  static getBaseFields(referrers, includeNoReturn = false) {
    const schema = this.jsonSchema || { properties: {} };
    return Object.keys(schema.properties)
      .filter((f) => {
        const filter = schema.properties[f];

        if (filter.noApiReturn && !includeNoReturn) {
          return false;
        }

        if (!filter.availableForReferrers) {
          return true;
        }

        let found = false;
        referrers.forEach((referrer) => {
          if (filter.availableForReferrers.includes(referrer)) {
            found = true;
          }
        });

        return found;
      });
  }

  static getAPIFieldsToAttributes(referrer, fields, extra = {}) {
    const attrs = this.getBaseFields(referrer, true);
    const attributes = [].concat(...fields.map((field) => {
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
    }).filter((field) => field !== null));

    return attributes;
  }

  static createValidator() {
    const validator = new AjvValidator({
      onCreateAjv: (ajv) => {
        // ajvKeywords(ajv);
        ajv.addSchema(geojsonPolygonSchema, 'GeojsonPolygon');
        ajv.addSchema(documentStatusSchema, 'DocumentStatus');
      },
    });

    return validator;
  }

  $parseDatabaseJson(databaseJson) {
    const json = super.$parseDatabaseJson(databaseJson);

    // Format dates to ISO 8601
    Object.keys(json).forEach((key) => {
      if (json[key] instanceof Date) {
        json[key] = moment(json[key]).toISOString(String);
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

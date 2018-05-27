import ajvKeywords from 'ajv-keywords';

import { Model, AjvValidator } from '@turistforeningen/ntb-shared-db-utils';

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
      if (attrs.includes(field)) {
        return [field];
      }
      if (extra[field]) {
        return extra[field];
      }
      return null;
    }).filter((field) => field !== null));

    return attributes;
  }

  static createValidator() {
    const validator = new AjvValidator({
      onCreateAjv: (ajv) => {
        ajvKeywords(ajv);
        ajv.addSchema(geojsonPolygonSchema, 'GeojsonPolygon');
        ajv.addSchema(documentStatusSchema, 'DocumentStatus');
      },
    });

    return validator;
  }

  $beforeInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  $beforeUpdate() {
    this.updatedAt = new Date();
  }
}

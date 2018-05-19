import ajvKeywords from 'ajv-keywords';

import { Model, AjvValidator } from '@turistforeningen/ntb-shared-db-utils';

import geojsonPolygonSchema from './schemas/geojson-polygon';
import documentStatusSchema from './schemas/document-status';


export default class BaseModel extends Model {
  static modelPaths = [__dirname];

  static getBaseFields(referrers) {
    const schema = this.jsonSchema || { properties: {} };
    return Object.keys(schema.properties)
      .filter((f) => {
        if (!f.availableForReferrers) {
          return true;
        }

        let found = false;
        referrers.forEach((referrer) => {
          if (f.availableForReferrers.includes(referrer)) {
            found = true;
          }
        });

        return found;
      });
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

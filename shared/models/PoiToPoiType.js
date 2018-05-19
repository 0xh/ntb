import BaseModel from './BaseModel';


export default class PoiToPoiType extends BaseModel {
  static tableName = 'poisToPoiTypes';
  static idColumn = ['poiType', 'poiId'];
}

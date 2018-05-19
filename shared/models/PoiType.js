import BaseModel from './BaseModel';


export default class PoiType extends BaseModel {
  static tableName = 'poiTypes';
  static idColumn = 'name';
}

import BaseModel from './BaseModel';


export default class PoiAccessability extends BaseModel {
  static tableName = 'poiAccessabilities';
  static idColumn = ['accessabilityName', 'poiId'];
}

import BaseModel from './BaseModel';


export default class PoiToArea extends BaseModel {
  static tableName = 'poisToAreas';
  static idColumn = ['poiId', 'areaId'];
}

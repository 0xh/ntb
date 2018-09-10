import BaseModel from './BaseModel';


export default class PoiToCounty extends BaseModel {
  static tableName = 'poisToCounties';
  static idColumn = ['poiId', 'countyId'];
}

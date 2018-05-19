import BaseModel from './BaseModel';


export default class AreaToCounty extends BaseModel {
  static tableName = 'areasToCounties';
  static idColumn = ['areaId', 'countyId'];
}

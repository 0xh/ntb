import BaseModel from './BaseModel';


export default class CabinToCounty extends BaseModel {
  static tableName = 'cabinsToCounties';
  static idColumn = ['cabinId', 'countyId'];
}

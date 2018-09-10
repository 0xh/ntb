import BaseModel from './BaseModel';


export default class CabinToArea extends BaseModel {
  static tableName = 'cabinsToAreas';
  static idColumn = ['cabinId', 'areaId'];
}

import BaseModel from './BaseModel';


export default class CabinServiceLevel extends BaseModel {
  static tableName = 'cabinServiceLevel';
  static idColumn = 'name';
}

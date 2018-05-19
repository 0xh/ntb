import BaseModel from './BaseModel';


export default class CabinAccessability extends BaseModel {
  static tableName = 'cabinAccessabilities';
  static idColumn = ['accessabilityName', 'cabinId'];
}

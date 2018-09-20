import BaseModel from './BaseModel';


export default class TripDirection extends BaseModel {
  static tableName = 'tripDirections';
  static idColumn = 'name';
}

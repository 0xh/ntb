import BaseModel from './BaseModel';


export default class TripLink extends BaseModel {
  static tableName = 'tripLinks';
  static idColumn = 'id';
}

import BaseModel from './BaseModel';


export default class TripAccessability extends BaseModel {
  static tableName = 'tripAccessabilities';
  static idColumn = ['accessabilityName', 'tripId'];
}

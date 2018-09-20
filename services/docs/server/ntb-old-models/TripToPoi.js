import BaseModel from './BaseModel';


export default class TripToPoi extends BaseModel {
  static tableName = 'tripsToPois';
  static idColumn = ['tripId', 'poiId'];
}

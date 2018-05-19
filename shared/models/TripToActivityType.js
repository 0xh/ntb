import BaseModel from './BaseModel';


export default class TripToActivityType extends BaseModel {
  static tableName = 'tripsToActivityTypes';
  static idColumn = ['tripId', 'activityTypeName'];
}

import BaseModel from './BaseModel';


export default class TripToCounty extends BaseModel {
  static tableName = 'tripsToCounties';
  static idColumn = ['tripId', 'countyId'];
}

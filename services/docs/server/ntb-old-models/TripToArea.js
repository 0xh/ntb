import BaseModel from './BaseModel';


export default class TripToArea extends BaseModel {
  static tableName = 'tripsToAreas';
  static idColumn = ['tripId', 'areaId'];
}

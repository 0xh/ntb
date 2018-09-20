import BaseModel from './BaseModel';


export default class TripToGroup extends BaseModel {
  static tableName = 'tripsToGroups';
  static idColumn = ['tripId', 'groupId'];
}

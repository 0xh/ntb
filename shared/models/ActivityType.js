import BaseModel from './BaseModel';


export default class ActivityType extends BaseModel {
  static tableName = 'activityTypes';
  static idColumn = 'name';
}

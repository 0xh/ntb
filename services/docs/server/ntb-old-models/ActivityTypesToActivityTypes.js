import BaseModel from './BaseModel';


export default class ActivityTypesToActivityTypes extends BaseModel {
  static tableName = 'activityTypesToActivityTypes';
  static idColumn = ['primaryType', 'subType'];
}

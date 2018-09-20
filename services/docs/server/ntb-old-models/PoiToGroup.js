import BaseModel from './BaseModel';


export default class PoiToGroup extends BaseModel {
  static tableName = 'poisToGroups';
  static idColumn = ['poiId', 'groupId'];
}

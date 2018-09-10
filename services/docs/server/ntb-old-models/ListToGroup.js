import BaseModel from './BaseModel';


export default class ListToGroup extends BaseModel {
  static tableName = 'listsToGroups';
  static idColumn = ['listId', 'groupId'];
}

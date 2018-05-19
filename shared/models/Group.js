import BaseModel from './BaseModel';


export default class Group extends BaseModel {
  static tableName = 'groups';
  static idColumn = 'id';
}

import BaseModel from './BaseModel';


export default class GroupType extends BaseModel {
  static tableName = 'groupTypes';
  static idColumn = 'name';
}

import BaseModel from './BaseModel';


export default class List extends BaseModel {
  static tableName = 'lists';
  static idColumn = 'id';
}

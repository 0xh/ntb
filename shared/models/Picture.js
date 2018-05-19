import BaseModel from './BaseModel';


export default class Picture extends BaseModel {
  static tableName = 'pictures';
  static idColumn = 'id';
}

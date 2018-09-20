import BaseModel from './BaseModel';


export default class Uuid extends BaseModel {
  static tableName = 'uuids';
  static idColumn = 'id';
}

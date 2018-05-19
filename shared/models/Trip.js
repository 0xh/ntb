import BaseModel from './BaseModel';


export default class Trip extends BaseModel {
  static tableName = 'trips';
  static idColumn = 'id';
}

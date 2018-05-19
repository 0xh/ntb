import BaseModel from './BaseModel';


export default class Facility extends BaseModel {
  static tableName = 'facilities';
  static idColumn = 'name';
}

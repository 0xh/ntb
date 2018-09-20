import BaseModel from './BaseModel';


export default class ListType extends BaseModel {
  static tableName = 'listTypes';
  static idColumn = 'name';
}

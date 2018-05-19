import BaseModel from './BaseModel';


export default class Municipality extends BaseModel {
  static tableName = 'municipalities';
  static idColumn = 'id';
}

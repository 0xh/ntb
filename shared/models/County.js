import BaseModel from './BaseModel';


export default class County extends BaseModel {
  static tableName = 'counties';
  static idColumn = 'id';
}

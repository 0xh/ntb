import BaseModel from './BaseModel';


export default class Route extends BaseModel {
  static tableName = 'routes';
  static idColumn = 'id';
}

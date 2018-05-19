import BaseModel from './BaseModel';


export default class Poi extends BaseModel {
  static tableName = 'pois';
  static idColumn = 'id';
}

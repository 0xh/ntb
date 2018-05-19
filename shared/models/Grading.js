import BaseModel from './BaseModel';


export default class Grading extends BaseModel {
  static tableName = 'gradings';
  static idColumn = 'name';
}

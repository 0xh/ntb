import BaseModel from './BaseModel';


export default class DocumentStatus extends BaseModel {
  static tableName = 'documentStatuses';
  static idColumn = 'name';
}

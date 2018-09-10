import BaseModel from './BaseModel';


export default class SearchConfig extends BaseModel {
  static tableName = 'searchConfig';
  static idColumn = 'name';
}

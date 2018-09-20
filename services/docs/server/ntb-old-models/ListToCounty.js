import BaseModel from './BaseModel';


export default class ListToCounty extends BaseModel {
  static tableName = 'listsToCounties';
  static idColumn = ['listId', 'countyId'];
}

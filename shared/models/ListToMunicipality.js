import BaseModel from './BaseModel';


export default class ListToMunicipality extends BaseModel {
  static tableName = 'listsToMunicipalities';
  static idColumn = ['listId', 'municipalityId'];
}

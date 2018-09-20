import BaseModel from './BaseModel';


export default class ListRelation extends BaseModel {
  static tableName = 'listRelations';
  static idColumn = ['listId', 'documentType', 'documentId'];
}

import Document from './Document';


export default class ListToMunicipality extends Document {
  static tableName = 'listsToMunicipalities';
  static idColumn = ['listId', 'municipalityId'];

  // Database columns
  readonly listId!: string;
  readonly municipalityId!: string;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

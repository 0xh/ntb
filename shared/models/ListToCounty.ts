import Document from './Document';


export default class ListToCounty extends Document {
  static tableName = 'listsToCounties';
  static idColumn = ['listId', 'countyId'];

  // Database columns
  readonly listId!: string;
  readonly countyId!: string;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

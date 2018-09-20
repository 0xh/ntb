import Document from './Document';


export default class ListToGroup extends Document {
  static tableName = 'listsToGroups';
  static idColumn = ['listId', 'groupId'];

  // Database columns
  readonly listId!: string;
  readonly groupId!: string;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

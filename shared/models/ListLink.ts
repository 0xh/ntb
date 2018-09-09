import Document, { linkType } from './Document';


export default class ListLink extends Document {
  static tableName = 'listLinks';
  static idColumn = 'id';

  // Database columns
  readonly id!: string;
  listId!: string;
  type!: linkType;
  title?: string;
  url!: string;
  sortIndex?: number;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

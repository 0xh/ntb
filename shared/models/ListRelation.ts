import Document from './Document';


type listDocumentTypes =
  | 'cabin'
  | 'poi';


export default class ListRelation extends Document {
  static tableName = 'listRelations';
  static idColumn = ['listId', 'documentType', 'documentId'];

  // Database columns
  readonly listId!: string;
  readonly documentType!: listDocumentTypes;
  readonly documentId!: string;
  sortIndex?: number;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

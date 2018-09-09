import Document, { documentType } from './Document';


export default class Uuid extends Document {
  static tableName = 'uuids';
  static idColumn = 'id';

  // Database columns
  readonly id!: string;
  documentType!: documentType;
}

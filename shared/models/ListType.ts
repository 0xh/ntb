import Document from './Document';


export default class ListType extends Document {
  static tableName = 'listTypes';
  static idColumn = 'name';

  // Database columns
  readonly name!: string;
  description?: string;
}

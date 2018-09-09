import Document from './Document';


export default class SearchConfig extends Document {
  static tableName = 'searchConfig';
  static idColumn = 'name';

  // Database columns
  readonly name!: string;
  boost?: number;
  weight?: 'A' | 'B' | 'C' | 'D';
}

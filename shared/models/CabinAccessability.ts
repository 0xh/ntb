import Document from './Document';


export default class CabinAccessability extends Document {
  static tableName = 'cabinAccessabilities';
  static idColumn = ['accessabilityName', 'cabinId'];

  // Database columns
  readonly accessabilityName!: string;
  readonly cabinId!: string;
  description?: string;
  dataSource?: string;
}

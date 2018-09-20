import Document from './Document';


export default class PoiAccessability extends Document {
  static tableName = 'poiAccessabilities';
  static idColumn = ['accessabilityName', 'poiId'];

  // Database columns
  readonly accessabilityName!: string;
  readonly poiId!: string;
  description?: string;
  dataSource?: string;
}

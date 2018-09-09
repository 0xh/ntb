import Document from './Document';


export default class TripAccessability extends Document {
  static tableName = 'tripAccessabilities';
  static idColumn = ['accessabilityName', 'tripId'];

  // Database columns
  readonly accessabilityName!: string;
  readonly tripId!: string;
  description?: string;
  dataSource?: string;
}

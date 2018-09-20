import Document from './Document';


export default class TripToPoi extends Document {
  static tableName = 'tripsToPois';
  static idColumn = ['tripId', 'poiId'];

  // Database columns
  readonly tripId!: string;
  readonly poiId!: string;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

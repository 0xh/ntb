import Document from './Document';


export default class TripToCounty extends Document {
  static tableName = 'tripsToCounties';
  static idColumn = ['tripId', 'countyId'];

  // Database columns
  readonly tripId!: string;
  readonly countyId!: string;
  processedVerified?: Date;
}

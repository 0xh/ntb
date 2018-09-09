import Document from './Document';


export default class TripToArea extends Document {
  static tableName = 'tripsToAreas';
  static idColumn = ['tripId', 'areaId'];

  // Database columns
  readonly tripId!: string;
  readonly areaId!: string;
  processedVerified?: Date;
}

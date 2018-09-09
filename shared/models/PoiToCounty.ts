import Document from './Document';


export default class PoiToCounty extends Document {
  static tableName = 'poisToCounties';
  static idColumn = ['poiId', 'countyId'];

  // Database columns
  readonly poiId!: string;
  readonly countyId!: string;
  processedVerified?: Date;
}

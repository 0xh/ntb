import Document from './Document';


export default class AreaToCounty extends Document {
  static tableName = 'areasToCounties';
  static idColumn = ['areaId', 'countyId'];

  // Database columns
  readonly areaId!: string;
  readonly countyId!: string;
  processedVerified?: Date;
}

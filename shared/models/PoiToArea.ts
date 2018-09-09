import Document from './Document';


export default class PoiToArea extends Document {
  static tableName = 'poisToAreas';
  static idColumn = ['poiId', 'areaId'];

  // Database columns
  readonly poiId!: string;
  readonly areaId!: string;
  processedVerified?: Date;
}

import Document from './Document';


export default class CabinToArea extends Document {
  static tableName = 'cabinsToAreas';
  static idColumn = ['cabinId', 'areaId'];

  // Database columns
  readonly cabinId!: string;
  readonly areaId!: string;
  processedVerified?: Date;
}

import Document from './Document';


export default class CabinToHazardRegion extends Document {
  static tableName = 'cabinsToHazardRegions';
  static idColumn = ['cabinId', 'hazardRegionId'];

  // Database columns
  readonly cabinId!: string;
  readonly hazardRegionId!: string;
  processedVerified?: Date;
}

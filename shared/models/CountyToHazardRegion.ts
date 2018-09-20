import Document from './Document';


export default class CountyToHazardRegion extends Document {
  static tableName = 'countiesToHazardRegions';
  static idColumn = ['countyId', 'hazardRegionId'];

  // Database columns
  readonly countyId!: string;
  readonly hazardRegionId!: string;
  processedVerified?: Date;
}

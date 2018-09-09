import Document from './Document';


export default class TripToHazardRegion extends Document {
  static tableName = 'tripsToHazardRegions';
  static idColumn = ['tripId', 'hazardRegionId'];

  // Database columns
  readonly tripId!: string;
  readonly hazardRegionId!: string;
  processedVerified?: Date;
}

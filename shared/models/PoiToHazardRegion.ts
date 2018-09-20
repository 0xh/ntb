import Document from './Document';


export default class PoiToHazardRegion extends Document {
  static tableName = 'poisToHazardRegions';
  static idColumn = ['poiId', 'hazardRegionId'];

  // Database columns
  readonly poiId!: string;
  readonly hazardRegionId!: string;
  processedVerified?: Date;
}

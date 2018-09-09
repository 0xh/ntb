import Document from './Document';


export default class AreaToHazardRegion extends Document {
  static tableName = 'areasToHazardRegions';
  static idColumn = ['areaId', 'hazardRegionId'];

  // Database columns
  readonly areaId!: string;
  readonly hazardRegionId!: string;
  processedVerified?: Date;
}

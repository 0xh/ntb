import Document from './Document';


export default class RouteToHazardRegion extends Document {
  static tableName = 'routesToHazardRegions';
  static idColumn = ['routeId', 'hazardRegionId'];

  // Database columns
  readonly routeId!: string;
  readonly hazardRegionId!: string;
  processedVerified?: Date;
}

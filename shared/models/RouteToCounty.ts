import Document from './Document';


export default class RouteToCounty extends Document {
  static tableName = 'routesToCounties';
  static idColumn = ['routeId', 'countyId'];

  // Database columns
  readonly routeId!: string;
  readonly countyId!: string;
  processedVerified?: Date;
}

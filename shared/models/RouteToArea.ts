import Document from './Document';


export default class RouteToArea extends Document {
  static tableName = 'routesToAreas';
  static idColumn = ['routeId', 'areaId'];

  // Database columns
  readonly routeId!: string;
  readonly areaId!: string;
  processedVerified?: Date;
}

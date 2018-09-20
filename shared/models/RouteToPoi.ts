import Document from './Document';


export default class RouteToPoi extends Document {
  static tableName = 'routesToPois';
  static idColumn = ['routeId', 'poiId'];

  // Database columns
  readonly routeId!: string;
  readonly poiId!: string;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

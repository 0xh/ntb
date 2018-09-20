import Document from './Document';


export default class RouteToActivityType extends Document {
  static tableName = 'routesToActivityTypes';
  static idColumn = ['routeId', 'activityTypeName'];

  // Database columns
  readonly routeId!: string;
  readonly activityTypeName!: string;
  sortIndex?: number;
  dataSource?: string;
}

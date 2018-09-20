import Document from './Document';


export default class RouteToRouteWaymarkType extends Document {
  static tableName = 'routesToRouteWaymarkTypes';
  static idColumn = ['routeId', 'routeWaymarkTypeName'];

  // Database columns
  readonly routeId!: string;
  readonly routeWaymarkTypeName!: string;
  dataSource?: string;
}

import Document from './Document';
import { routeSegmentType } from './RouteSegment';


export default class RouteToRouteSegment extends Document {
  static tableName = 'routesToRouteSegments';
  static idColumn = ['routeId', 'routeSegmentId'];

  // Database columns
  readonly routeId!: string;
  readonly routeSegmentId!: string;
  type!: routeSegmentType;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

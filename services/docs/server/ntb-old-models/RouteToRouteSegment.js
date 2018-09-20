import BaseModel from './BaseModel';


export default class RouteToRouteSegment extends BaseModel {
  static tableName = 'routesToRouteSegments';
  static idColumn = ['routeId', 'routeSegmentId'];
}

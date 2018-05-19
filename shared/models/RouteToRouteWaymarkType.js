import BaseModel from './BaseModel';


export default class RouteToRouteWaymarkType extends BaseModel {
  static tableName = 'routesToRouteWaymarkTypes';
  static idColumn = ['routeId', 'routeWaymarkTypeName'];
}

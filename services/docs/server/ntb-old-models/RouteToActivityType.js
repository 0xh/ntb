import BaseModel from './BaseModel';


export default class RouteToActivityType extends BaseModel {
  static tableName = 'routesToActivityTypes';
  static idColumn = ['routeId', 'activityTypeName'];
}

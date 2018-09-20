import BaseModel from './BaseModel';


export default class RouteToArea extends BaseModel {
  static tableName = 'routesToAreas';
  static idColumn = ['routeId', 'areaId'];
}

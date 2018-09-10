import BaseModel from './BaseModel';


export default class RouteToGroup extends BaseModel {
  static tableName = 'routesToGroups';
  static idColumn = ['routeId', 'groupId'];
}

import BaseModel from './BaseModel';


export default class RouteToCounty extends BaseModel {
  static tableName = 'routesToCounties';
  static idColumn = ['routeId', 'countyId'];
}

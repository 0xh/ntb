import BaseModel from './BaseModel';


export default class RouteToPoi extends BaseModel {
  static tableName = 'routesToPois';
  static idColumn = ['routeId', 'poiId'];
}

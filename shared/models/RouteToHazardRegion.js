import BaseModel from './BaseModel';


export default class RouteToHazardRegion extends BaseModel {
  static tableName = 'routesToHazardRegions';
  static idColumn = ['routeId', 'hazardRegionId'];
}

import BaseModel from './BaseModel';


export default class RouteSegmentToHazardRegion extends BaseModel {
  static tableName = 'routeSegmentsToHazardRegions';
  static idColumn = ['routeSegmentId', 'hazardRegionId'];
}

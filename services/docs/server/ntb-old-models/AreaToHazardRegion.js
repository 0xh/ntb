import BaseModel from './BaseModel';


export default class AreaToHazardRegion extends BaseModel {
  static tableName = 'areasToHazardRegions';
  static idColumn = ['areaId', 'hazardRegionId'];
}

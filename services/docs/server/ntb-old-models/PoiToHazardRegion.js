import BaseModel from './BaseModel';


export default class PoiToHazardRegion extends BaseModel {
  static tableName = 'poisToHazardRegions';
  static idColumn = ['poiId', 'hazardRegionId'];
}

import BaseModel from './BaseModel';


export default class CabinToHazardRegion extends BaseModel {
  static tableName = 'cabinsToHazardRegions';
  static idColumn = ['cabinId', 'hazardRegionId'];
}

import BaseModel from './BaseModel';


export default class CountyToHazardRegion extends BaseModel {
  static tableName = 'countiesToHazardRegions';
  static idColumn = ['countyId', 'hazardRegionId'];
}

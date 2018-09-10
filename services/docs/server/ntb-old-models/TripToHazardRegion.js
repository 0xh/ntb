import BaseModel from './BaseModel';


export default class TripToHazardRegion extends BaseModel {
  static tableName = 'tripsToHazardRegions';
  static idColumn = ['tripId', 'hazardRegionId'];
}

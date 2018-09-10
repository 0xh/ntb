import BaseModel from './BaseModel';


export default class MunicipalityToHazardRegion extends BaseModel {
  static tableName = 'municipalitiesToHazardRegions';
  static idColumn = ['municipalityId', 'hazardRegionId'];
}

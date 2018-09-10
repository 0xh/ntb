import BaseModel from './BaseModel';


export default class PoiToMunicipality extends BaseModel {
  static tableName = 'poisToMunicipalities';
  static idColumn = ['poiId', 'municipalityId'];
}

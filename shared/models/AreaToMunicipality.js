import BaseModel from './BaseModel';


export default class AreaToMunicipality extends BaseModel {
  static tableName = 'areasToMunicipalities';
  static idColumn = ['areaId', 'municipalityId'];
}

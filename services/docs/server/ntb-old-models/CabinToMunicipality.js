import BaseModel from './BaseModel';


export default class CabinToMunicipality extends BaseModel {
  static tableName = 'cabinsToMunicipalities';
  static idColumn = ['cabinId', 'municipalityId'];
}

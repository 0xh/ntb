import BaseModel from './BaseModel';


export default class TripToMunicipality extends BaseModel {
  static tableName = 'tripsToMunicipalities';
  static idColumn = ['tripId', 'municipalityId'];
}

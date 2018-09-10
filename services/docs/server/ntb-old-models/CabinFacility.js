import BaseModel from './BaseModel';


export default class CabinFacility extends BaseModel {
  static tableName = 'cabinFacilities';
  static idColumn = ['facilityName', 'cabinId'];
}

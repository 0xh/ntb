import BaseModel from './BaseModel';


export default class CabinOpeningHoursKeyType extends BaseModel {
  static tableName = 'cabinOpeningHoursKeyTypes';
  static idColumn = 'name';
}

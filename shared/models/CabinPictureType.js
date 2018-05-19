import BaseModel from './BaseModel';


export default class CabinPictureType extends BaseModel {
  static tableName = 'cabinPictureTypes';
  static idColumn = 'name';
}

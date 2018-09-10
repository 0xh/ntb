import BaseModel from './BaseModel';


export default class AreaToArea extends BaseModel {
  static tableName = 'areasToAreas';
  static idColumn = ['areaAId', 'areaBId'];
}

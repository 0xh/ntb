import BaseModel from './BaseModel';


export default class RouteToMunicipality extends BaseModel {
  static tableName = 'routesToMunicipalities';
  static idColumn = ['routeId', 'countyId'];
}

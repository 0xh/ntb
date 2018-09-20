import BaseModel from './BaseModel';


export default class RouteToPoiByDistance extends BaseModel {
  static tableName = 'routesToPoisByDistance';
  static idColumn = ['routeId', 'poiId'];

  static validFilters = {
    calculatedDistance: {
      type: 'number',
      options: {
        filterTypes: ['=', '>', '<', '<=', '>='],
      },
    },
  }
}

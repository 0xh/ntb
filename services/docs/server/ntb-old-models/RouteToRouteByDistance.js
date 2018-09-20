import BaseModel from './BaseModel';


export default class RouteToRouteByDistance extends BaseModel {
  static tableName = 'routesToRoutesByDistance';
  static idColumn = ['routeAId', 'routeBId'];

  static validFilters = {
    calculatedDistance: {
      type: 'number',
      options: {
        filterTypes: ['=', '>', '<', '<=', '>='],
      },
    },
  }
}

import BaseModel from './BaseModel';


export default class RouteToTripByDistance extends BaseModel {
  static tableName = 'routesToTripsByDistance';
  static idColumn = ['routeId', 'tripId'];

  static validFilters = {
    calculatedDistance: {
      type: 'number',
      options: {
        filterTypes: ['=', '>', '<', '<=', '>='],
      },
    },
  }
}

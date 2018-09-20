import BaseModel from './BaseModel';


export default class RouteToCabinByDistance extends BaseModel {
  static tableName = 'routesToCabinsByDistance';
  static idColumn = ['routeId', 'cabinId'];

  static validFilters = {
    calculatedDistance: {
      type: 'number',
      options: {
        filterTypes: ['=', '>', '<', '<=', '>='],
      },
    },
  }
}

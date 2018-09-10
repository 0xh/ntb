import BaseModel from './BaseModel';


export default class CabinToTripByDistance extends BaseModel {
  static tableName = 'cabinsToTripsByDistance';
  static idColumn = ['cabinId', 'tripId'];

  static validFilters = {
    calculatedDistance: {
      type: 'number',
      options: {
        filterTypes: ['=', '>', '<', '<=', '>='],
      },
    },
  }
}

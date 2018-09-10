import BaseModel from './BaseModel';


export default class TripToTripByDistance extends BaseModel {
  static tableName = 'tripsToTripsByDistance';
  static idColumn = ['tripAId', 'tripBId'];

  static validFilters = {
    calculatedDistance: {
      type: 'number',
      options: {
        filterTypes: ['=', '>', '<', '<=', '>='],
      },
    },
  }
}

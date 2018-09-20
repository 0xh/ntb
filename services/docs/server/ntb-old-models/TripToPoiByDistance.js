import BaseModel from './BaseModel';


export default class TripToPoiByDistance extends BaseModel {
  static tableName = 'tripsToPoisByDistance';
  static idColumn = ['tripId', 'poiId'];

  static validFilters = {
    calculatedDistance: {
      type: 'number',
      options: {
        filterTypes: ['=', '>', '<', '<=', '>='],
      },
    },
  }
}

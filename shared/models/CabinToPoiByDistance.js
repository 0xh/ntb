import BaseModel from './BaseModel';


export default class CabinToPoiByDistance extends BaseModel {
  static tableName = 'cabinsToPoisByDistance';
  static idColumn = ['cabinId', 'poiId'];

  static validFilters = {
    calculatedDistance: {
      type: 'number',
      options: {
        filterTypes: ['=', '>', '<', '<=', '>='],
      },
    },
  }
}

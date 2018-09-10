import BaseModel from './BaseModel';


export default class PoiToPoiByDistance extends BaseModel {
  static tableName = 'poisToPoisByDistance';
  static idColumn = ['poiId', 'poiId'];

  static validFilters = {
    calculatedDistance: {
      type: 'number',
      options: {
        filterTypes: ['=', '>', '<', '<=', '>='],
      },
    },
  }
}

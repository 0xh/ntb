import BaseModel from './BaseModel';


export default class CabinToCabinByDistance extends BaseModel {
  static tableName = 'cabinsToCabinsByDistance';
  static idColumn = ['cabinAId', 'cabinBId'];

  static validFilters = {
    calculatedDistance: {
      type: 'number',
      options: {
        filterTypes: ['=', '>', '<', '<=', '>='],
      },
    },
  }
}

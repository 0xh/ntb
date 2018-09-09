import Document, { apiFilters } from './Document';


export default class CabinToPoiByDistance extends Document {
  static tableName = 'cabinsToPoisByDistance';
  static idColumn = ['cabinId', 'poiId'];

  // Database columns
  readonly cabinId!: string;
  readonly poiId!: string;
  calculatedDistance?: number;
  processedVerified?: Date;

  static filters: apiFilters = {
    calculatedDistance: {
      type: 'number',
      filterTypes: ['=', '$gt', '$lt', '$gte', '$lte'],
    },
  }
}

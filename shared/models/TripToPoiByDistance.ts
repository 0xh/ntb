import Document, { apiFilters } from './Document';


export default class TripToPoiByDistance extends Document {
  static tableName = 'tripsToPoisByDistance';
  static idColumn = ['tripId', 'poiId'];

  // Database columns
  readonly tripId!: string;
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

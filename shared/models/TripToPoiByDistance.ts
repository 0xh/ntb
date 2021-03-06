import Document, { ApiConfigJoinTable } from './Document';


export default class TripToPoiByDistance extends Document {
  static tableName = 'tripsToPoisByDistance';
  static idColumn = ['tripId', 'poiId'];

  // Database columns
  readonly tripId!: string;
  readonly poiId!: string;
  calculatedDistance?: number;
  processedVerified?: Date;

  static apiConfig: ApiConfigJoinTable = {
    filters: {
      calculatedDistance: {
        type: 'number',
        filterTypes: ['=', '$gt', '$lt', '$gte', '$lte'],
      },
    },
    ordering: {
      validFields: [
        'calculatedDistance'
      ],
    },
  }
}

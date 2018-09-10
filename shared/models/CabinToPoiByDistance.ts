import Document, { apiConfigJoinTable } from './Document';


export default class CabinToPoiByDistance extends Document {
  static tableName = 'cabinsToPoisByDistance';
  static idColumn = ['cabinId', 'poiId'];

  // Database columns
  readonly cabinId!: string;
  readonly poiId!: string;
  calculatedDistance?: number;
  processedVerified?: Date;

  static apiConfig: apiConfigJoinTable = {
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

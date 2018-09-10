import Document, { apiConfigJoinTable } from './Document';


export default class TripToTripByDistance extends Document {
  static tableName = 'tripsToTripsByDistance';
  static idColumn = ['tripAId', 'tripBId'];

  // Database columns
  readonly tripAId!: string;
  readonly tripBId!: string;
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

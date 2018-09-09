import Document, { apiFilters } from './Document';


export default class TripToTripByDistance extends Document {
  static tableName = 'tripsToTripsByDistance';
  static idColumn = ['tripAId', 'tripBId'];

  // Database columns
  readonly tripAId!: string;
  readonly tripBId!: string;
  calculatedDistance?: number;
  processedVerified?: Date;

  static filters: apiFilters = {
    calculatedDistance: {
      type: 'number',
      filterTypes: ['=', '$gt', '$lt', '$gte', '$lte'],
    },
  }
}

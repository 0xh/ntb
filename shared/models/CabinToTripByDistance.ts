import Document, { apiFilters } from './Document';


export default class CabinToTripByDistance extends Document {
  static tableName = 'cabinsToTripsByDistance';
  static idColumn = ['cabinId', 'tripId'];

  // Database columns
  readonly cabinId!: string;
  readonly tripId!: string;
  calculatedDistance?: number;
  processedVerified?: Date;

  static filters: apiFilters = {
    calculatedDistance: {
      type: 'number',
      filterTypes: ['=', '$gt', '$lt', '$gte', '$lte'],
    },
  }
}

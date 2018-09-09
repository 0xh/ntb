import Document, { apiFilters } from './Document';


export default class RouteToTripByDistance extends Document {
  static tableName = 'routesToTripsByDistance';
  static idColumn = ['routeId', 'tripId'];

  // Database columns
  readonly routeId!: string;
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

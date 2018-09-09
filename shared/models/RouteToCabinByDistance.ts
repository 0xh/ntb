import Document, { apiFilters } from './Document';


export default class RouteToCabinByDistance extends Document {
  static tableName = 'routesToCabinsByDistance';
  static idColumn = ['routeId', 'cabinId'];

  // Database columns
  readonly routeId!: string;
  readonly cabinId!: string;
  calculatedDistance?: number;
  processedVerified?: Date;

  static filters: apiFilters = {
    calculatedDistance: {
      type: 'number',
      filterTypes: ['=', '$gt', '$lt', '$gte', '$lte'],
    },
  }
}

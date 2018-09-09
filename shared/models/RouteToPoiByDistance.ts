import Document, { apiFilters } from './Document';


export default class RouteToPoiByDistance extends Document {
  static tableName = 'routesToPoisByDistance';
  static idColumn = ['routeId', 'poiId'];

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

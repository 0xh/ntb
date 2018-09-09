import Document, { apiFilters } from './Document';


export default class RouteToRouteByDistance extends Document {
  static tableName = 'routesToRoutesByDistance';
  static idColumn = ['routeAId', 'routeBId'];

  // Database columns
  readonly routeAId!: string;
  readonly routeBId!: string;
  calculatedDistance?: number;
  processedVerified?: Date;

  static filters: apiFilters = {
    calculatedDistance: {
      type: 'number',
      filterTypes: ['=', '$gt', '$lt', '$gte', '$lte'],
    },
  }
}

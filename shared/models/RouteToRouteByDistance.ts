import Document, { apiConfigJoinTable } from './Document';


export default class RouteToRouteByDistance extends Document {
  static tableName = 'routesToRoutesByDistance';
  static idColumn = ['routeAId', 'routeBId'];

  // Database columns
  readonly routeAId!: string;
  readonly routeBId!: string;
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

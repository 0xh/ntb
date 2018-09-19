import Document, { ApiConfigJoinTable } from './Document';


export default class RouteToCabinByDistance extends Document {
  static tableName = 'routesToCabinsByDistance';
  static idColumn = ['routeId', 'cabinId'];

  // Database columns
  readonly routeId!: string;
  readonly cabinId!: string;
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

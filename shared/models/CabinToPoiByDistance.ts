import Document, { ApiConfigJoinTable } from './Document';


export default class CabinToPoiByDistance extends Document {
  static tableName = 'cabinsToPoisByDistance';
  static idColumn = ['cabinId', 'poiId'];

  // Database columns
  readonly cabinId!: string;
  readonly poiId!: string;
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
        'calculatedDistance',
      ],
    },
  };
}

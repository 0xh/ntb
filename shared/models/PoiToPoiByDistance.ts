import Document, { apiConfigJoinTable } from './Document';


export default class PoiToPoiByDistance extends Document {
  static tableName = 'poisToPoisByDistance';
  static idColumn = ['poiAId', 'poiBId'];

  // Database columns
  readonly poiAId!: string;
  readonly poiBId!: string;
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

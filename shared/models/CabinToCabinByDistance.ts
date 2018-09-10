import Document, { apiConfigJoinTable } from './Document';


export default class CabinToCabinByDistance extends Document {
  static tableName = 'cabinsToCabinsByDistance';
  static idColumn = ['cabinAId', 'cabinBId'];

  // Database columns
  readonly cabinAId!: string;
  readonly cabinBId!: string;
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

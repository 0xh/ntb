import Document, { apiFilters } from './Document';


export default class CabinToCabinByDistance extends Document {
  static tableName = 'cabinsToCabinsByDistance';
  static idColumn = ['cabinAId', 'cabinBId'];

  // Database columns
  readonly cabinAId!: string;
  readonly cabinBId!: string;
  calculatedDistance?: number;
  processedVerified?: Date;

  static filters: apiFilters = {
    calculatedDistance: {
      type: 'number',
      filterTypes: ['=', '$gt', '$lt', '$gte', '$lte'],
    },
  }
}

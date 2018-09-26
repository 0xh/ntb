import Document from './Document';


export default class DocumentStatus extends Document {
  static tableName = 'uniqueNames';
  static idColumn = 'name';

  // Database columns
  readonly name!: string;
  searchNb!: string;
  areaIds?: string[];
  cabinIds?: string[];
  poiIds?: string[];
  routeIds?: string[];
  tripIds?: string[];
  autocompleteRank: number = 0;
}

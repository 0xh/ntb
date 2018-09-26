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
  isArea: boolean = false;
  isCabin: boolean = false;
  isPoi: boolean = false;
  isRoute: boolean = false;
  isTrip: boolean = false;
}

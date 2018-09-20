import Document from './Document';


export default class RouteToMunicipality extends Document {
  static tableName = 'routesToMunicipalities';
  static idColumn = ['routeId', 'municipalityId'];

  // Database columns
  readonly routeId!: string;
  readonly municipalityId!: string;
  processedVerified?: Date;
}

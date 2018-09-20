import Document from './Document';


export default class TripToMunicipality extends Document {
  static tableName = 'tripsToMunicipalities';
  static idColumn = ['tripId', 'municipalityId'];

  // Database columns
  readonly tripId!: string;
  readonly municipalityId!: string;
  processedVerified?: Date;
}

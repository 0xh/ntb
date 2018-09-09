import Document from './Document';


export default class AreaToMunicipality extends Document {
  static tableName = 'areasToMunicipalities';
  static idColumn = ['areaId', 'municipalityId'];

  // Database columns
  readonly areaId!: string;
  readonly municipalityId!: string;
  processedVerified?: Date;
}

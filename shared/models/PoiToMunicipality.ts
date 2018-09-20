import Document from './Document';


export default class PoiToMunicipality extends Document {
  static tableName = 'poisToMunicipalities';
  static idColumn = ['poiId', 'municipalityId'];

  // Database columns
  readonly poiId!: string;
  readonly municipalityId!: string;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

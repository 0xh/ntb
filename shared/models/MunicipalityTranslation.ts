import Document from './Document';


export default class MunicipalityTranslation extends Document {
  static tableName = 'municipalitiesTranslations';
  static idColumn = 'id';

  // Database columns
  readonly id!: string;
  municipalityId!: string;
  name!: string;
  nameLowerCase!: string;
  language!: string;
  dataSource?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

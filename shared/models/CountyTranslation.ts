import Document from './Document';


export default class CountyTranslation extends Document {
  static tableName = 'countiesTranslations';
  static idColumn = 'id';

  // Database columns
  readonly id!: string;
  countyId!: string;
  name!: string;
  nameLowerCase!: string;
  language!: string;
  dataSource?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

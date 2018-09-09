import Document from './Document';


export default class CabinTranslation extends Document {
  static tableName = 'cabinTranslations';
  static idColumn = 'id';

  // Database columns
  readonly id!: string;
  cabinId!: string;
  name!: string;
  nameLowerCase!: string;
  description?: string;
  descriptionPlain?: string;
  language!: string;
  dataSource?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

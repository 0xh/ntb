import Document from './Document';


export default class AreaToArea extends Document {
  static tableName = 'areasToAreas';
  static idColumn = ['areaAId', 'areaBId'];

  // Database columns
  readonly parentId!: string;
  readonly childId!: string;
  dataSource?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

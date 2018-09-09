import Document from './Document';


export default class PoiToGroup extends Document {
  static tableName = 'poisToGroups';
  static idColumn = ['poiId', 'groupId'];

  // Database columns
  readonly poiId!: string;
  readonly groupId!: string;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

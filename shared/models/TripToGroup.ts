import Document from './Document';


export default class TripToGroup extends Document {
  static tableName = 'tripsToGroups';
  static idColumn = ['tripId', 'groupId'];

  // Database columns
  readonly tripId!: string;
  readonly groupId!: string;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

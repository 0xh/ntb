import Document from './Document';


export default class TripToActivityType extends Document {
  static tableName = 'tripsToActivityTypes';
  static idColumn = ['tripId', 'activityTypeName'];

  // Database columns
  readonly tripId!: string;
  readonly activityTypeName!: string;
  primary!: boolean;
  sortIndex?: number;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

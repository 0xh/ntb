import Document from './Document';


export default class ActivityTypesToActivityTypes extends Document {
  static tableName = 'activityTypesToActivityTypes';
  static idColumn = ['primaryType', 'subType'];

  // Database columns
  readonly primaryType!: string;
  readonly subType!: string;
}

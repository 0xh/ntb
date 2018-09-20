import Document from './Document';


export default class TripDirection extends Document {
  static tableName = 'tripDirections';
  static idColumn = 'name';

  // Database columns
  readonly name!: string;
}

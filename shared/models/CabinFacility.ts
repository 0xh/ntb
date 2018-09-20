import Document from './Document';


export default class CabinFacility extends Document {
  static tableName = 'cabinFacilities';
  static idColumn = ['facilityName', 'cabinId'];

  // Database columns
  readonly facilityName!: string;
  readonly cabinId!: string;
  description?: string;
  dataSource?: string;
}

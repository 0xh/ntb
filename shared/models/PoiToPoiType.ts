import Document from './Document';


export default class PoiToPoiType extends Document {
  static tableName = 'poisToPoiTypes';
  static idColumn = ['poiType', 'poiId'];

  // Database columns
  readonly poiType!: string;
  readonly poiId!: string;
  primary!: boolean;
  sortIndex!: number;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

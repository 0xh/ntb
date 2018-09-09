import { geojson } from '@ntb/gis-utils';
import { RelationMappings } from '@ntb/db-utils';

import Document, { documentStatus } from './Document';


export default class List extends Document {
  static tableName = 'lists';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];

  // Database columns
  readonly id!: string;
  readonly idLegacyNtb?: string;
  listType!: string;
  name!: string;
  nameLowerCase!: string;
  description?: string;
  descriptionPlain?: string;
  coordinates?: geojson.MultiPoint;
  startDate?: Date;
  endDate?: Date;
  license?: string;
  provider!: string;
  status!: documentStatus;
  dataSource?: string;
  searchDocumentBoost?: number;
  searchNb?: number;
  searchEn?: number;
  createdAt!: Date;
  updatedAt!: Date;


  get uri() {
    return `list/${this.id}`;
  }


  static relationMappings: RelationMappings = {
    // TODO(Roar):
    // links
    // pois
    // cabins
    // county
    // municipality
  };


  static geometryAttributes = [
    'coordinates',
  ];
}

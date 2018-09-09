import Document, { documentStatus } from './Document';


export type searchDocumentType =
  | 'area'
  | 'cabin'
  | 'group'
  | 'list'
  | 'poi'
  | 'route'
  | 'trip';


export default class SearchDocument extends Document {
  static tableName = 'searchDocument';
  static idColumn = 'id';

  // Database columns
  readonly id!: string;
  documentType!: searchDocumentType;
  documentId!: string;
  status!: documentStatus;
  searchDocumentBoost!: number;
  searchDocumentTypeBoost!: number;
  searchNb?: string;
  searchEn?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

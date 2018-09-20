import Document from './Document';


export default class RouteToGroup extends Document {
  static tableName = 'routesToGroups';
  static idColumn = ['routeId', 'groupId'];

  // Database columns
  readonly routeId!: string;
  readonly groupId!: string;
  dataSource?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

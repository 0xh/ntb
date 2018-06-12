import BaseModel from './BaseModel';


export default class List extends BaseModel {
  static tableName = 'lists';
  static idColumn = 'id';
  static virtualAttributes = ['uri'];


  get uri() {
    return `list/${this.id}`;
  }


  static relationMappings = {
    // TODO(Roar):
    // links
    // pois
    // cabins
    // county
    // municipality
  };
}

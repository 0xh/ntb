import BaseModel from './BaseModel';


export default class AreaToArea extends BaseModel {
  static tableName = 'areasToAreas';
  static idColumn = ['parentId', 'childId'];


  static relationMappings = {
    child: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: 'Area',
      join: {
        from: 'areasToAreas.childId',
        to: 'areas.id',
      },
    },
    parent: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: 'Area',
      join: {
        from: 'areasToAreas.parentId',
        to: 'areas.id',
      },
    },
  }
}

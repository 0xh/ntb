import BaseModel from './BaseModel';


export default class SystemSettings extends BaseModel {
  static tableName = 'systemSettings';
  static idColumn = 'name';


  static async getSettings(name) {
    const result = await this
      .query()
      .where('name', name);

    if (result.length > 1) {
      throw new Error(`Multiple system settings for "${name}" found`);
    }

    if (result.length) {
      return result[0];
    }

    const instance = await this
      .query()
      .insert({ name, settings: {} });

    return instance;
  }
}

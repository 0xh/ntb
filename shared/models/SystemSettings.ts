import Document from './Document';


export default class SystemSettings extends Document {
  static tableName = 'systemSettings';
  static idColumn = 'name';

  // Database columns
  name!: string;
  settings!: { [key: string]: any };


  static async getSettings(name: string) {
    const result = await this
      .query()
      .where('name', name);

    if (result.length > 1) {
      throw new Error(`Multiple system settings for "${name}" found`);
    }

    // If settings exist, return the instance
    if (result.length) {
      return result[0];
    }

    // Create the settings key if it does not exist
    const instance = await this
      .query()
      .insert({ name, settings: {} });

    return instance;
  }
}

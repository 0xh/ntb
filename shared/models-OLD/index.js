import fs from 'fs';
import path from 'path';
import { sequelize, Sequelize } from '@turistforeningen/ntb-shared-db-utils';


const basename = path.basename(__filename);
const db = {};


// Loop through all .js files starting with an uppercase letter in the current
// directory (not subdirectories). Every identified file is presumed to default
// export a Sequelize model.
fs
  .readdirSync(__dirname)
  .filter((file) => (
    (file.indexOf('.') !== 0)
    && (file !== basename)
    && (file.slice(-3) === '.js')
    && (file[0] === file[0].toUpperCase())
  ))
  .forEach((file) => {
    const model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });


// Configure associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});


// Set sequelize instance on db for convinience when using in other modules
db.sequelize = sequelize;
db.Sequelize = Sequelize;


export default db;

import moment from 'moment';

import { createLogger } from '@turistforeningen/ntb-shared-utils';
import { knex, Model } from '@turistforeningen/ntb-shared-db-utils';


const logger = createLogger();


const TYPES = [
  {
    mainTable: 'cabins',
    mainAttribute: 'coordinates',
    joinTable: 'hazard_regions',
    joinAttribute: 'geometry',
    throughTable: 'cabins_to_hazard_regions',
  },
];


// async function createTempTable(suffix) {
//   const timeStamp = moment().format('YYYYMMDDHHmmssSSS');
//   const tableName = `0_${timeStamp}_hazard_${suffix}`;

//   logger.info(`Creating temp table: ${tableName}`);

//   await knex.schema.createTable(tableName, (table) => {
//     table.increments('id');
//     table.text('type');
//     table.integer('regionId');
//     table.text('name');
//     table.integer('regionTypeId');
//     table.text('regionType');
//     table.specificType('geometry', 'GEOMETRY');
//   });

//   class TempModel extends Model {
//     static tableName = tableName;
//   }
//   return TempModel;
// }


// async function deleteTempTable(tableName) {
//   await knex.schema.dropTableIfExists(tableName);
// }



// async function processType({ type, url }) {
//   const tableName = await harvestToTempTable(type, url);

//   logger.info('Updating hazard_region data');

//   // Merge into production table
//   await knex.raw([
//     'INSERT INTO hazard_regions (',
//     '  id,',
//     '  type,',
//     '  name,',
//     '  region_id,',
//     '  region_type_id,',
//     '  region_type,',
//     '  geometry',
//     ')',
//     'SELECT',
//     '  uuid_generate_v4(),',
//     '  a."type",',
//     '  a."name",',
//     '  a."region_id",',
//     '  a."region_type_id",',
//     '  a."region_type",',
//     '  a."geometry"',
//     `FROM "${tableName}" a`,
//     'ON CONFLICT ("type", region_id) DO UPDATE SET',
//     '  name = EXCLUDED.name,',
//     '  region_type_id = EXCLUDED.region_type_id,',
//     '  region_type = EXCLUDED.region_type,',
//     '  geometry = EXCLUDED.geometry',
//   ].join('\n'));

//   logger.info('Deleting temp table');
//   await deleteTempTable(tableName);
// }


// async function process() {
//   const promises = HAZARD_TYPES.map((h) => processType(h));
//   await Promise.all(promises);
// }


// process()
//   .then((res) => {
//     logger.info('Completed harvesting hazard regions');
//     process.exit(0);
//   })
//   .catch((err) => {
//     logger.error('UNCAUGHT ERROR');
//     logger.error(err);
//     logger.error(err.stack);
//     process.exit(1);
//   });

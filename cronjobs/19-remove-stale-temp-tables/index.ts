import { Logger, moment, startDuration, printDuration } from "@ntb/utils";
import { knex } from "@ntb/db-utils";


const DELETE_OLDER_THEN_HOURS = 12;


const logger = Logger.getLogger();
let deletedCount = 0;


async function main(): Promise<void> {
  const result = await knex.raw(`
    SELECT DISTINCT
      t.table_name
    FROM information_schema.tables t
    WHERE
      t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name LIKE '0_%'
  `);

  if (result.rowCount) {
    const rows = result.rows as Array<{ table_name: string }>;
    for (const row of rows) {
      const { table_name: tableName } = row;
      const dateString = tableName.slice(2, 19);
      const tableDate = moment(dateString, 'YYYYMMDDHHmmssSSS');
      if (tableDate < moment().subtract(DELETE_OLDER_THEN_HOURS, 'hours')) {
        logger.info(`Dropping table ${tableName}`);
        await knex.schema.dropTableIfExists(tableName);
        deletedCount += 1;
      }
    }
  }
}


const durationId = startDuration();
main()
  .then(() => {
    logger.info(`ALL DONE - Deleted tables: ${deletedCount}`);
    printDuration(durationId);
    process.exit(0);
  })
  .catch((err) => {
    logger.error('UNCAUGHT ERROR');
    printDuration(durationId);
    logger.error(err);
    logger.error(err.stack);
    process.exit(1);
  });

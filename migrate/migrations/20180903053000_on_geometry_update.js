
async function addTrigger(knex, tableName, columnName) {
  await knex.schema.raw(`
    CREATE FUNCTION ${tableName}_${columnName}_geometry_update_trigger()
    RETURNS trigger AS $$
    BEGIN
      IF ST_Equals(NEW."${columnName}", OLD."${columnName}") IS FALSE THEN
        NEW.${columnName}_updated_at = NOW();
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.schema.raw(`
    CREATE TRIGGER ${tableName}_${columnName}_geometry_update
    BEFORE UPDATE OF "${columnName}" ON "${tableName}" FOR EACH ROW
    EXECUTE PROCEDURE ${tableName}_${columnName}_geometry_update_trigger();
  `);
}


export async function up(knex) {
  await addTrigger(knex, 'areas', 'geometry');
  await addTrigger(knex, 'cabins', 'coordinates');
  await addTrigger(knex, 'counties', 'geometry');
  await addTrigger(knex, 'hazard_regions', 'geometry');
  await addTrigger(knex, 'municipalities', 'geometry');
  await addTrigger(knex, 'pois', 'coordinates');
  await addTrigger(knex, 'routes', 'path');
  await addTrigger(knex, 'trips', 'path');
}


export async function down(knex) {
  return true;
}

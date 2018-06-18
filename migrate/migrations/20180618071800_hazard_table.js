

async function createHazardRegions(knex) {
  await knex.schema.createTable('hazardRegions', (table) => {
    table.uuid('id')
      .primary();
    table.text('type')
      .notNullable();
    table.text('name')
      .notNullable();
    table.integer('regionId')
      .notNullable();
    table.integer('regionTypeId');
    table.text('regionType');
    table.specificType('geometry', 'GEOMETRY');

    table.timestamps(true, true);

    table.unique(['type', 'regionId']);
    table.index('geometry', null, 'GIST');
  });

  // Create insert trigger procedure
  await knex.schema.raw([
    'CREATE FUNCTION hazard_regions_uuid_insert_trigger() ',
    'RETURNS trigger AS $$',
    'BEGIN',
    '  INSERT INTO "public"."uuids" (id, document_type)',
    '  VALUES (NEW.id, \'hazardRegion\');',
    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'));

  // Create delete trigger procedure
  await knex.schema.raw([
    'CREATE FUNCTION hazard_regions_uuid_delete_trigger() ',
    'RETURNS trigger AS $$',
    'BEGIN',
    '  DELETE FROM "public"."uuids" WHERE id = OLD.id;',
    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'));

  // Use trigger after each insert
  await knex.schema.raw([
    'CREATE TRIGGER hazard_regions_uuid_insert AFTER INSERT',
    'ON "hazard_regions"',
    'FOR EACH ROW EXECUTE PROCEDURE hazard_regions_uuid_insert_trigger();',
  ].join('\n'));

  // Use trigger after each delete
  await knex.schema.raw([
    'CREATE TRIGGER hazard_regions_uuid_delete AFTER DELETE',
    'ON "hazard_regions"',
    'FOR EACH ROW EXECUTE PROCEDURE hazard_regions_uuid_delete_trigger();',
  ].join('\n'));
}


export async function up(knex) {
  await createHazardRegions(knex);
}


export async function down(knex) {
  // Drop tables
  await knex.schema
    .dropTableIfExists('hazardRegions');

  // Drop triggers
  await knex.schema
    .raw(
      'DROP TRIGGER IF EXISTS hazard_regions_uuid_insert ON "hazard_regions";'
    )
    .raw(
      'DROP TRIGGER IF EXISTS hazard_regions_uuid_delete ON "hazard_regions";'
    )
    .raw('DROP FUNCTION IF EXISTS hazard_regions_uuid_insert_trigger();')
    .raw('DROP FUNCTION IF EXISTS hazard_regions_uuid_delete_trigger();');
}

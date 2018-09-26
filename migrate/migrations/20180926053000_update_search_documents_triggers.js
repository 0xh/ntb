const NAMES = [
  'area',
  'cabin',
  'group',
  'list',
  'poi',
  'route',
  'trip',
];


export async function up(knex) {
  await knex.schema.table('searchDocuments', (table) => {
    table.float('searchDocumentManualBoost')
      .default(0);
  });

  for (const name of NAMES) {
    await knex.schema.raw(`
      CREATE OR REPLACE FUNCTION
        ${name}s_search_document_trigger()
      RETURNS trigger AS $$
      DECLARE
        boost FLOAT;
      BEGIN
        SELECT sbc.boost INTO boost
        FROM search_config AS sbc
        WHERE sbc.name = 'search_document__${name}';

        INSERT INTO search_documents (
          id, document_type, document_id, status, search_nb,
          search_document_boost, search_document_manual_boost,
          search_document_type_boost, created_at, updated_at
        )
        VALUES (
          uuid_generate_v4(), '${name}', NEW.id, NEW.status, NEW.search_nb,
          NEW.search_document_boost, NEW.search_document_manual_boost, boost,
          NEW.created_at, NEW.updated_at
        )
        ON CONFLICT ("document_type", "document_id")
        DO UPDATE
        SET
          search_nb = EXCLUDED.search_nb,
          search_document_boost = EXCLUDED.search_document_boost,
          search_document_manual_boost = EXCLUDED.search_document_manual_boost,
          search_document_type_boost = boost,
          created_at = EXCLUDED.created_at,
          updated_at = EXCLUDED.updated_at;

        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
    `);
  }
}


export async function down(knex) {
  return true;
}

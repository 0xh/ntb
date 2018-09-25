
export async function up(knex) {
  await knex.schema.raw(`
    CREATE VIEW unique_names AS
    SELECT DISTINCT name_lower_case, 'cabin' as document_type
    FROM cabins
    WHERE name_lower_case IS NOT NULL
    UNION
    SELECT DISTINCT name_lower_case, 'trip' as document_type
    FROM trips
    WHERE name_lower_case IS NOT NULL
    UNION
    SELECT DISTINCT name_lower_case, 'poi' as document_type
    FROM pois
    WHERE name_lower_case IS NOT NULL
  `);
}


export async function down(knex) {
  return true;
}

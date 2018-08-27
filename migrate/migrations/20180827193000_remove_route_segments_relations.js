
export async function up(knex) {
  await knex.schema
    .dropTableIfExists('route_segments_to_cabins_by_distance')
    .dropTableIfExists('route_segments_to_hazard_regions')
    .dropTableIfExists('route_segments_to_pois_by_distance')
    .dropTableIfExists('route_segments_to_route_segments_by_distance')
    .dropTableIfExists('route_segments_to_trips_by_distance');
}


export async function down(knex) {
  return true;
}

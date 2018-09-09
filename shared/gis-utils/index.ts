import polyline from '@mapbox/polyline';
import * as g from 'geojson';

import { Knex, st } from '@ntb/db-utils';

import { validateAndFixGeojson } from './validate';


export { default as geojson } from 'geojson';


export function geomFromGeoJSON(geojson: object): null | Knex.QueryBuilder {
  const validatedGeojson = validateAndFixGeojson(geojson);

  if (validatedGeojson === null) {
    return null;
  }

  return st.geomFromGeoJSON(validatedGeojson);
}


export function geojsonToPolyline(
  geojson: g.LineString | g.Feature<g.LineString, g.GeoJsonProperties>,
) {
  return polyline.fromGeoJSON(geojson);
}

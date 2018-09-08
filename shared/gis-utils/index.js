import geoJSONRewind from 'geojson-rewind';
import mapboxPolyline from '@mapbox/polyline';
import GJV from 'geojson-validation';

import { knex } from '@ntb/db-utils';


const st = knex.postgis;


export function geomFromGeoJSON(geojson) {
  let res;

  try {
    res = st.geomFromGeoJSON(geojson);
  }
  catch (err) {
    if (
      Array.isArray(err.errors)
      && err.errors.length > 0
      && err.errors[0]
      && err.errors[0].message
    ) {
      const { message } = err.errors[0];

      // Polygon is drawn in the wrong direction
      const rightHandErr = (
        'Polygons and MultiPolygons should follow the right-hand rule'
      );
      if (message === rightHandErr) {
        res = st.geomFromGeoJSON(geoJSONRewind(geojson));
      }

      // GeoJSON contains an invalid 'properties'-key
      const invalidPropertiesKey = (
        'geometry object cannot contain a "properties" member'
      );
      if (message === invalidPropertiesKey) {
        const newGeojson = geojson;
        delete newGeojson.properties;
        res = st.geomFromGeoJSON(newGeojson);
      }
    }
    else {
      throw err;
    }
  }

  return st.setSRID(res, 4326);
}


export function geojsonToPolyline(geojson) {
  return mapboxPolyline.fromGeoJSON(geojson);
}


export function validateGeojson(geojson) {
  let res;
  GJV.valid(geojson, (valid, errs) => {
    res = [valid, errs];
  });
  return res;
}

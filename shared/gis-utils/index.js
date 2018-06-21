import geoJSONRewind from 'geojson-rewind';
import mapboxPolyline from '@mapbox/polyline';
import GJV from 'geojson-validation';
import { stringify } from 'wellknown';

import { knex } from '@turistforeningen/ntb-shared-db-utils';


const st = knex.postgis;


export function geomFromGeoJSON(geojson) {
  let res;
  let wkt = stringify(geojson);

  try {
    res = st.geomFromText(wkt, 4326);
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
        const newGeojson = geoJSONRewind(geojson);
        wkt = stringify(newGeojson);
        res = st.geomFromText(wkt, 4326);
      }

      // GeoJSON contains an invalid 'properties'-key
      const invalidPropertiesKey = (
        'geometry object cannot contain a "properties" member'
      );
      if (message === invalidPropertiesKey) {
        delete geojson.properties;
        const newGeojson = geoJSONRewind(geojson);
        wkt = stringify(newGeojson);
        res = st.geomFromText(wkt, 4326);
      }
    }
    else {
      throw err;
    }
  }

  return res;
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

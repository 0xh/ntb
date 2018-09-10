/// <reference types="geojson" />

type geojson = GeoJSON.Polygon | GeoJSON.MultiPolygon;
declare function geojsonRewind(geojson: geojson): geojson;

declare module 'geojson-rewind' {
  export = geojsonRewind;
}

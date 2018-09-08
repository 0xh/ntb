/// <reference types="geojson" />

type geojson = GeoJSON.LineString | GeoJSON.Feature<GeoJSON.LineString>;
declare function geojsonRewind(geojson: geojson): geojson;

declare module 'geojson-rewind' {
  export = geojsonRewind;
}

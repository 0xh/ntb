
declare module 'geojson-validation' {
  type callback = (status: boolean, errors: string[]) => void;

  export function valid(geojson: object, cb?: callback): boolean;
  export function isGeoJSONObject(geojson: object, cb?: callback): boolean;
  export function isGeometryObject(geojson: object, cb?: callback): boolean;
  export function isPosition(geojson: object, cb?: callback): boolean;
  export function isPoint(geojson: object, cb?: callback): boolean;
  export function isMultiPointCoor(geojson: object, cb?: callback): boolean;
  export function isMultiPoint(geojson: object, cb?: callback): boolean;
  export function isLineStringCoor(geojson: object, cb?: callback): boolean;
  export function isLineString(geojson: object, cb?: callback): boolean;
  export function isMultiLineStringCoor(geojson: object, cb?: callback): boolean;
  export function isMultiLineString(geojson: object, cb?: callback): boolean;
  export function isPolygonCoor(geojson: object, cb?: callback): boolean;
  export function isPolygon(geojson: object, cb?: callback): boolean;
  export function isMultiPolygonCoor(geojson: object, cb?: callback): boolean;
  export function isMultiPolygon(geojson: object, cb?: callback): boolean;
  export function isGeometryCollection(geojson: object, cb?: callback): boolean;
  export function isFeature(geojson: object, cb?: callback): boolean;
  export function isFeatureCollection(geojson: object, cb?: callback): boolean;
  export function isBbox(geojson: object, cb?: callback): boolean;
}

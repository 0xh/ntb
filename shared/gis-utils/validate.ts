import geojsonRewind from 'geojson-rewind';
import geojsonhint from '@mapbox/geojsonhint';
import geojsonValidation from 'geojson-validation';
import * as g from 'geojson';
import { Logger } from '@ntb/utils';


const logger = Logger.getLogger();


const RIGHT_HAND_RULE_ERR =
  'Polygons and MultiPolygons should follow the right-hand rule';

const INVALID_PROPERTIES_MEMBER_ERR =
  'geometry object cannot contain a "properties" member';


export function isGeoJSONObject(geojson: object): geojson is g.GeoJSON {
  return geojsonValidation.isGeoJSONObject(geojson);
}


export function isGeometryObject(geojson: object): geojson is g.Geometry {
  return geojsonValidation.isGeometryObject(geojson);
}


export function isPosition(geojson: object): geojson is g.Position {
  return geojsonValidation.isPosition(geojson);
}


export function isPoint(geojson: object): geojson is g.Point {
  return geojsonValidation.isPoint(geojson);
}


export function isMultiPointCoor(geojson: object): geojson is g.Point[] {
  return geojsonValidation.isMultiPointCoor(geojson);
}


export function isMultiPoint(geojson: object): geojson is g.MultiPoint {
  return geojsonValidation.isMultiPoint(geojson);
}


export function isLineStringCoor(geojson: object): geojson is g.Point[] {
  return geojsonValidation.isLineStringCoor(geojson);
}


export function isLineString(geojson: object): geojson is g.LineString {
  return geojsonValidation.isLineString(geojson);
}


export function isMultiLineStringCoor(
  geojson: object,
): geojson is g.Point[][] {
  return geojsonValidation.isMultiLineStringCoor(geojson);
}


export function isMultiLineString(
  geojson: object,
): geojson is g.MultiLineString {
  return geojsonValidation.isMultiLineString(geojson);
}


export function isPolygonCoor(geojson: object): geojson is g.Point[] {
  return geojsonValidation.isPolygonCoor(geojson);
}


export function isPolygon(geojson: object): geojson is g.Polygon {
  return geojsonValidation.isPolygon(geojson);
}


export function isMultiPolygonCoor(geojson: object): geojson is g.Point[][] {
  return geojsonValidation.isMultiPolygonCoor(geojson);
}


export function isMultiPolygon(geojson: object): geojson is g.MultiPolygon {
  return geojsonValidation.isMultiPolygon(geojson);
}


export function isGeometryCollection(
  geojson: object,
): geojson is g.GeometryCollection {
  return geojsonValidation.isGeometryCollection(geojson);
}


export function isFeature(geojson: object): geojson is g.Feature {
  return geojsonValidation.isFeature(geojson);
}


export function isFeatureCollection(
  geojson: object,
): geojson is g.FeatureCollection {
  return geojsonValidation.isFeatureCollection(geojson);
}


export function isBbox(geojson: object): geojson is g.BBox {
  return geojsonValidation.isBbox(geojson);
}


export function isLineStringFeature(
  geojson: object,
): geojson is g.Feature<g.LineString> {
  if (isFeature(geojson)) {
    return geojson.geometry.type === 'LineString';
  }
  return false;
}


export function validateAndFixGeojson(geojson: object): null | g.GeoJSON {
  if (!isGeoJSONObject(geojson)) {
    return null;
  }
  let newGeojson = geojson;

  const hints = geojsonhint.hint(geojson);
  if (hints.length) {
    let valid = true;
    hints.forEach((hint) => {
      // Fix right hand rule error
      if (
        hint.message === RIGHT_HAND_RULE_ERR
        && (isPolygon(newGeojson) || isMultiPolygon(newGeojson))
      ) {
        newGeojson = geojsonRewind(newGeojson);
      }

      // Fix invalid properties member error
      else if (hint.message === INVALID_PROPERTIES_MEMBER_ERR) {
        type geojsonWithInvalidProperty = g.GeoJSON & { properties: any };
        delete (newGeojson as geojsonWithInvalidProperty).properties;
      }

      else {
        logger.error('Unable to resolve the geojson hint');
        logger.error(hint.message);
        valid = false;
      }
    });

    if (!valid) {
      return null;
    }
  }

  return newGeojson;
}

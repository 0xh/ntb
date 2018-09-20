declare module '@mapbox/geojsonhint' {
  interface objectHintItem {
    level: 'message',
    message: string,
  }

  interface stringHintItem extends objectHintItem {
    line: number,
  }

  export function hint(geojson: string): stringHintItem[];
  export function hint(geojson: object): objectHintItem[];
}

import fs from 'fs';
import path from 'path';

import moment from 'moment';

import { createLogger } from '@turistforeningen/ntb-shared-utils';
import { knex } from '@turistforeningen/ntb-shared-db-utils';
import wfsDownload from '@turistforeningen/ntb-shared-wfs-utils/download';


const logger = createLogger();


// app:AnnenRute / 10
// app:Fotrute / 11
// app:RuteInfoPunkt / not needed
// app:Skiløype / 12
// app:Sykkelrute / 13


const SRS_NAME = 'EPSG:25833';
const FOLDER = path.resolve(__dirname, 'data');
const TYPES = [
  {
    wfsType: 'app:skiløype',
    routeType: 'skiroutes',
    unnest: (
      'string_to_array(substring(a.rutenummer ' +
      'from \'\\([0-9]+:(.+)\\)\'), \',\')'
    ), // (2:xx,xx)
  },
  {
    wfsType: 'app:Fotrute',
    routeType: 'footroutes',
    unnest: 'a.rutenummer',
  },
  {
    wfsType: 'app:sykkelrute',
    routeType: 'bikeroutes',
    unnest: (
      'string_to_array(substring(a.rutenummer ' +
      'from \'\\([0-9]+:(.+)\\)\'), \',\')'
    ), // (2:xx,xx)
  },
];


function createClearDataFolder() {
  logger.info(`create/clear ${FOLDER} folder`);

  // Create directory if not exists
  if (!fs.existsSync(FOLDER)) {
    fs.mkdirSync(FOLDER);
  }

  // Remove previous files if exists
  const files = fs.readdirSync(FOLDER);
  files.forEach((file) => {
    const filePath = path.resolve(FOLDER, file);
    const stat = fs.statSync(path.resolve(FOLDER, filePath));
    if (!stat.isDirectory()) {
      fs.unlinkSync(filePath);
    }
  });
}


async function createTempGeometryTable(routeType) {
  logger.info('Create temp geometry table');

  const timeStamp = moment().format('YYYYMMDDHHmmssSSS');
  const tableName = `0_${timeStamp}_routegeom_${routeType}`;

  // Create temp table
  await knex.schema.createTable(tableName, (table) => {
    table.increments('id');
    table.text('gmlId');
    table.text('routes');
    table.integer('km');
    table.specificType('geom', 'GEOMETRY');

    table.index('geom', null, 'GIST');
  });

  return tableName;
}


async function createTempPointsTable(routeType) {
  logger.info('Create temp points table');

  const timeStamp = moment().format('YYYYMMDDHHmmssSSS');
  const tableName = `0_${timeStamp}_routegeomp_${routeType}`;

  // Create temp table
  await knex.schema.createTable(tableName, (table) => {
    table.text('id')
      .primary();
    table.specificType('geom', 'GEOMETRY');

    table.index('geom', null, 'GIST');
  });

  return tableName;
}


async function insertRouteData(geometryTableName, wfsTableName) {
  logger.info('Insert base route data');

  await knex.raw(`
    INSERT INTO "${geometryTableName}" (id, km, geom)
    SELECT
      (ROW_NUMBER() OVER ()),
      (ST_3DLength(geom) / 1000)::integer,
      geom
    FROM (
      SELECT
        (ST_Dump(ST_Split(routes, ST_Snap(cabins, routes, 100)))).geom
      FROM (
        SELECT
          ST_LineMerge(ST_Union(r.wkb_geometry)) AS routes,
          ST_Collect(c.coordinates) AS cabins
        FROM "${wfsTableName}" r
        LEFT JOIN cabins c
        ON ST_DWithin(r.wkb_geometry, c.coordinates, 100)
      ) sq1
    ) sq2
  `);
}


async function setRouteIdentifiers(geometryTableName, wfsTableName, unnest) {
  logger.info('Add original ids and route identifiers');

  await knex.raw(`
    UPDATE "${geometryTableName}"
    SET gml_id = sq.gml_id,
      routes = sq.routes
    FROM (
      SELECT
        id,
        array_to_string(array_agg(
          distinct substring(a.gml_id from '[a-z.]+(.+)')
        ), ',') AS gml_id,
        array_to_string(array_agg(distinct route), ',') AS routes
      FROM "${geometryTableName}" r
      LEFT JOIN "${wfsTableName}" a ON
        ST_Intersects(r.geom, a.wkb_geometry)
        AND NOT ST_Touches(r.geom, a.wkb_geometry),
      unnest(${unnest}) AS route
      GROUP BY id
    ) sq
    WHERE "${geometryTableName}".id = sq.id
  `);
}


async function insertPointsData(geometryTableName, pointsTableName) {
  logger.info('Insert base route data');

  await knex.raw(`
    INSERT INTO "${pointsTableName}" (id, geom)
    SELECT
      (ROW_NUMBER() OVER ()),
      sub.geom
    FROM ((
      SELECT DISTINCT ST_StartPoint(geom) AS geom
      FROM "${geometryTableName}"
    ) UNION (
      SELECT DISTINCT ST_EndPoint(geom) AS geom
      FROM "${geometryTableName}"
    )) sub
  `);
}


async function processRouteType({ wfsType, routeType, unnest }) {
  logger.info(`Process routes of type ${routeType}`);

  const wfs = (
    'http://wfs.geonorge.no/skwms1/wfs.turogfriluftsruter?service=WFS' +
    `&version=2.0.0&request=GetFeature&typeName=${wfsType}&srsName=${SRS_NAME}`
  );

  const wfsTableName = await wfsDownload(wfs);

  if (wfsTableName === false) {
    logger.warn('Downloading wfs failed.');
    return;
  }

  const geometryTableName = await createTempGeometryTable(routeType);
  const pointsTableName = await createTempPointsTable(routeType);

  await insertRouteData(geometryTableName, wfsTableName);
  await setRouteIdentifiers(geometryTableName, wfsTableName, unnest);
  await insertPointsData(geometryTableName, pointsTableName);
}


createClearDataFolder();
processRouteType(TYPES[0])
  .then((res) => {
    logger.debug('ALL DONE');
  });

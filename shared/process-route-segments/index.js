import {
  Logger,
  startDuration,
  printDuration,
  moment,
} from '@ntb/utils';
import { knex } from '@ntb/db-utils';


const logger = Logger.getLogger();
const DATASOURCE = 'kartverket-ruter';


async function verifyWfsData(wfsTable) {
  logger.info('Verifying wfs-data exists');
  const result = await knex(wfsTable).count('*');

  if (!result || !result.length || !result[0] || !result[0].count) {
    throw new Error(`${wfsTable} does not contain any rows?`);
  }
}


async function createTempGeometryTable(type) {
  logger.info('Create temp geometry table');
  const durationId = startDuration();

  const timeStamp = moment().format('YYYYMMDDHHmmssSSS');
  const tableName = `0_${timeStamp}_routeseg_${type}`;

  // Create temp table
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id')
      .primary();
    table.specificType('gmlIds', 'TEXT[]');
    table.specificType('codes', 'TEXT[]');
    table.specificType('maintainers', 'TEXT[]');
    table.integer('meters');
    table.specificType('geom', 'GEOMETRY(LineString, 25833)');
    table.specificType('pointA', 'GEOMETRY(Point, 25833)');
    table.specificType('pointB', 'GEOMETRY(Point, 25833)');

    table.index('geom', null, 'GIST');
    table.index('pointA', null, 'GIST');
    table.index('pointB', null, 'GIST');
  });

  // Set correct SRID
  // await Promise.all(['geom', 'point_a', 'point_b'].map((c) => (
  //   knex.raw(`SELECT UpdateGeometrySRID('${tableName}', '${c}', 25833);`)
  // )));

  printDuration(durationId);
  return tableName;
}


async function deleteTempGeometryTable(geometryTableName) {
  await knex.schema.dropTableIfExists(geometryTableName);
}


async function insertRouteDataToTempTable(geometryTableName, wfsTableName) {
  logger.info('Insert base route data to temp table');
  const durationId = startDuration();

  await knex.raw(`
    INSERT INTO "${geometryTableName}" (id, meters, geom, point_a, point_b)
    SELECT
      uuid_generate_v4(),
      ST_3DLength(geom)::integer,
      geom,
      ST_StartPoint(geom),
      ST_EndPoint(geom)
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

  printDuration(durationId);
}


async function setRouteIdentifiers(
  geometryTableName,
  wfsTableName,
  unnestCodes,
  unnestMaintainers
) {
  logger.info('Set route identifiers, maintainers and code on temp data');
  const durationId = startDuration();

  await knex.raw(`
    UPDATE "${geometryTableName}"
    SET
      gml_ids = sq.gml_id,
      codes = sq.routes,
      maintainers = ARRAY(
        SELECT TRIM(x) FROM UNNEST(sq.maintainers) x WHERE x != '...'
      )
    FROM (
      SELECT
        id,
        array_agg(
          distinct substring(a.gml_id from '[a-z.]+(.+)')
        ) AS gml_id,
        array_agg(distinct route) AS routes,
        array_agg(distinct maintainer) AS maintainers
      FROM "${geometryTableName}" r
      LEFT JOIN "${wfsTableName}" a ON
        ST_Intersects(r.geom, a.wkb_geometry)
        AND NOT ST_Touches(r.geom, a.wkb_geometry),
      unnest(${unnestCodes}) AS route,
      unnest(${unnestMaintainers}) AS maintainer
      GROUP BY id
    ) sq
    WHERE "${geometryTableName}".id = sq.id
  `);

  printDuration(durationId);
}


async function deleteOldData(routeType) {
  logger.info('Removing old routes to route segments');
  await knex.raw(`
    DELETE FROM routes_to_route_segments WHERE
    data_source = :data_source AND "type" = :type
  `, {
    data_source: DATASOURCE,
    type: routeType,
  });

  logger.info('Removing old route segments');
  await knex.raw(`
      DELETE FROM route_segments WHERE
      data_source = :data_source AND "type" = :type
  `, {
    data_source: DATASOURCE,
    type: routeType,
  });
}


async function populateRouteSegments(routeType, geometryTableName) {
  logger.info('Creating route segments');
  await knex.raw(`
    INSERT INTO route_segments (
      "id",
      "type",
      gml_ids,
      maintainers,
      calculated_distance,
      path,
      point_a,
      point_b,
      data_source
    )
    SELECT
      t.id,
      :type,
      t.gml_ids,
      t.maintainers,
      t.meters,
      t.geom,
      ST_StartPoint(t.geom),
      ST_EndPoint(t.geom),
      :data_source
    FROM "${geometryTableName}" t
    WHERE
      t.gml_ids IS NOT NULL
  `, {
    data_source: DATASOURCE,
    type: routeType,
  });
}


async function createNewRoutes(routeType, geometryTableName) {
  logger.info('Creating missing routes based on type and code');
  const searchConfig = await knex('searchConfig')
    .select('boost')
    .where({ name: 'search_document__route' });
  const { boost } = searchConfig[0];

  await knex.raw(`
    INSERT INTO routes (
      "id",
      "type",
      code,
      provider,
      status,
      search_document_boost
    )
    SELECT
      uuid_generate_v4(),
      :type,
      x.code,
      :provider,
      :status,
      :boost
    FROM (
      SELECT DISTINCT
        t_code code
      FROM "${geometryTableName}" t
      LEFT JOIN UNNEST(t.codes) t_code ON true
      LEFT JOIN routes r ON
        r.code = t_code AND
        r.type = :type
      WHERE
        r.id IS NULL
        AND t.gml_ids IS NOT NULL
    ) x
  `, {
    provider: 'kartverket',
    status: 'public',
    type: routeType,
    boost,
  });
}


async function updateRouteTypes(routeType, geometryTableName) {
  logger.info('Updating route types for routes from legacy-ntb');
  await knex.raw(`
    UPDATE routes SET
      "type" = :type
    WHERE
      "id" IN (
        SELECT DISTINCT
          r.id
        FROM "${geometryTableName}" t
        LEFT JOIN UNNEST(t.codes) t_code ON true
        LEFT JOIN routes r ON
          r.code = t_code
        WHERE
          r.id IS NOT NULL
          AND r."type" IS NULL
          AND t.gml_ids IS NOT NULL
    )
  `, {
    type: routeType,
  });
}


async function createRoutesToRouteSegments(routeType, geometryTableName) {
  logger.info('Creating route to route segments relations');

  await knex.raw(`
    INSERT INTO routes_to_route_segments (
      route_id,
      route_segment_id,
      data_source,
      "type"
    )
    SELECT
      r.id,
      t.segment_id,
      :data_source,
      :type
    FROM (
      SELECT DISTINCT
        t.id segment_id,
        t_code code,
        :type "type"
      FROM "${geometryTableName}" t
      LEFT JOIN UNNEST(t.codes) t_code ON true
      WHERE
        t.gml_ids IS NOT NULL
    ) t
    INNER JOIN routes r ON
      r.code = t.code
      AND r."type" = t."type"
  `, {
    type: routeType,
    data_source: DATASOURCE,
  });
}


async function calculateRouteDistance(routeType, geometryTableName) {
  logger.info('Calculating route distance');

  await knex.raw(`
    UPDATE routes SET
      calculated_distance = c.calculated_distance
    FROM (
      SELECT
        rtrs.route_id,
        SUM(rs.calculated_distance) calculated_distance
      FROM route_segments rs
      INNER JOIN routes_to_route_segments rtrs ON
        rtrs.route_segment_id = rs.id
      WHERE
        rs."type" = :type
      GROUP BY
        rtrs.route_id
    ) c
    WHERE
      routes.id = c.route_id
  `, {
    type: routeType,
  });
}


async function resetRoutPaths(routeType) {
  logger.info('Emptying current route paths');

  await knex.raw(`
    UPDATE routes SET
      path = NULL,
      path_buffer = NULL
    WHERE
      routes."type" = :type
  `, {
    type: routeType,
  });
}


async function aggregateRoutePathBulk(
  routeType,
  geometryTableName,
  large = false
) {
  logger.info(
    `Aggregate ${large ? 'large' : ''} route path`
  );
  const largeClause = large
    ? '>= 100000'
    : '< 100000';
  const limit = large
    ? 1
    : 100;

  const result = await knex.raw(`
    UPDATE routes SET
      path = x.path,
      path_buffer = ST_Buffer(x.path, 5000, 1)
    FROM (
      SELECT
        r.id,
        ST_LineMerge(ST_Collect(rs.path)) "path"
      FROM routes r
      INNER JOIN routes_to_route_segments rtrs ON
        r.id = rtrs.route_id
      INNER JOIN route_segments rs ON
        rs.id = rtrs.route_segment_id
      WHERE
        r."type" = :type
        AND r.calculated_distance > 0
        AND r.calculated_distance ${largeClause}
        AND r.path IS NULL
      GROUP BY
        r.id
      LIMIT ${limit}
    ) x
    WHERE
      routes.id = x.id
  `, {
    type: routeType,
  })
    .catch((err) => {
      logger.error('Processing route path failed!');
      logger.error(err);
    });

  const rowCount = result ? result.rowCount : 0;
  logger.info(`- Updated ${rowCount} rows`);
  return rowCount;
}


async function aggregateRoutePath(routeType, geometryTableName) {
  logger.info('Aggregate route path');

  await resetRoutPaths(routeType);

  let rowCount = 1;
  while (rowCount > 0) {
    // eslint-disable-next-line
    rowCount = await aggregateRoutePathBulk(
      routeType,
      geometryTableName,
    );
  }

  // Do large paths one by one
  rowCount = 1;
  while (rowCount > 0) {
    // eslint-disable-next-line
    rowCount = await aggregateRoutePathBulk(
      routeType,
      geometryTableName,
      true
    );
  }
}


export default async function (
  type,
  wfsTable,
  unnestCodes,
  unnestMaintainers
) {
  logger.info(`Process route segments of type ${type}`);
  const durationId = startDuration();

  await verifyWfsData(wfsTable);
  const geometryTableName = await createTempGeometryTable(type);


  await insertRouteDataToTempTable(geometryTableName, wfsTable);
  await setRouteIdentifiers(
    geometryTableName,
    wfsTable,
    unnestCodes,
    unnestMaintainers
  );
  await deleteOldData(type);
  await populateRouteSegments(type, geometryTableName);
  await createNewRoutes(type, geometryTableName);
  await updateRouteTypes(type, geometryTableName);
  await createRoutesToRouteSegments(type, geometryTableName);
  await calculateRouteDistance(type);
  await aggregateRoutePath(type);
  await deleteTempGeometryTable(geometryTableName);

  printDuration(durationId);
}

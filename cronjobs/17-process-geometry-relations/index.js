import {
  Logger,
  startDuration,
  printDuration,
} from '@ntb/utils';
import { knex } from '@ntb/db-utils';


const logger = Logger.getLogger();

const MAX_DISTANCE = 5000;
const LIMIT = 30;

const DOCUMENT_TABLES = {
  areas: { geomField: 'geometry' },
  cabins: { geomField: 'coordinates' },
  counties: { geomField: 'geometry', singular: 'county' },
  hazard_regions: { geomField: 'geometry' },
  municipalities: { geomField: 'geometry', singular: 'municipality' },
  pois: { geomField: 'coordinates' },
  routes: { geomField: 'path', bufferField: 'path_buffer' },
  trips: { geomField: 'path', bufferField: 'path_buffer' },
};

const RELATION_TABLES = [
  'cabins_to_areas',
  'areas_to_counties',
  'areas_to_hazard_regions',
  'areas_to_municipalities',
  'pois_to_areas',
  'routes_to_areas',
  'trips_to_areas',
  'cabins_to_trips_by_distance',
  'cabins_to_cabins_by_distance',
  'cabins_to_hazard_regions',
  'cabins_to_pois_by_distance',
  'routes_to_cabins_by_distance',
  'counties_to_hazard_regions',
  'routes_to_counties',
  'trips_to_counties',
  'municipalities_to_hazard_regions',
  'pois_to_hazard_regions',
  'routes_to_hazard_regions',
  'trips_to_hazard_regions',
  'routes_to_municipalities',
  'trips_to_municipalities',
  'pois_to_pois_by_distance',
  'routes_to_pois_by_distance',
  'trips_to_pois_by_distance',
  'routes_to_trips_by_distance',
  'trips_to_trips_by_distance',
  'routes_to_routes_by_distance',
];


const TABLE_IDS = {};


async function getIds() {
  // eslint-disable-next-line
  for (let table of Object.keys(DOCUMENT_TABLES)) {
    logger.info(`Getting IDs for ${table}`);
    const { geomField, bufferField } = DOCUMENT_TABLES[table];
    TABLE_IDS[table] = [];

    // eslint-disable-next-line
    const result = await knex.raw(`
      SELECT
        id
      FROM ${table}
      WHERE
        (
          processed_relations_updated_at IS NULL
          OR ${geomField}_updated_at > processed_relations_updated_at
        )
        AND ${bufferField || geomField} IS NOT NULL
      ORDER BY
        id ASC
      LIMIT ${LIMIT}
    `);

    TABLE_IDS[table] = result.rows.map((row) => row.id);
    logger.info(`- Found ${result.rowCount} rows`);
  }
}


async function processRelation(relationTable) {
  const byDistance = relationTable.endsWith('_by_distance');
  const [tableA, tableB] = relationTable
    .replace('_by_distance', '')
    .split('_to_');
  const selfReference = tableA === tableB;

  // eslint-disable-next-line
  for (const reversed of [false, true]) {
    const tblA = reversed ? tableB : tableA;
    const tblB = reversed ? tableA : tableB;
    const selfA = reversed ? '_b' : '_a';
    const selfB = reversed ? '_a' : '_b';
    const { singular: singularA } = DOCUMENT_TABLES[tblA];
    const { singular: singularB } = DOCUMENT_TABLES[tblB];

    const ids = TABLE_IDS[tblA];
    const { geomField: geomA, bufferField: bufferFieldA } =
      DOCUMENT_TABLES[tblA];
    const { geomField: geomB, bufferField: bufferFieldB } =
      DOCUMENT_TABLES[tblB];
    const intersectFieldA = bufferFieldA || geomA;
    const intersectFieldB = bufferFieldA ? geomB : (bufferFieldB || geomB);
    const distance = `,ST_Distance(a.${geomA}, b.${geomB})::INTEGER`;

    let geometryClause = `
      ST_Intersects(
        a.${intersectFieldA},
        b.${intersectFieldB}
      ) IS TRUE
    `;
    if (byDistance && !bufferFieldA) {
      geometryClause = `
        ST_DWithin(
          a.${geomA},
          b.${geomB},
          ${MAX_DISTANCE}
        ) IS TRUE
      `;
    }

    if (ids && ids.length) {
      logger.info(`Prossesing relations for ${tblA} to ${tblB}`);
      // eslint-disable-next-line
      const status = await knex.raw(`
        INSERT INTO ${relationTable} (
          ${singularA || tblA.slice(0, -1)}${selfReference ? selfA : ''}_id,
          ${singularB || tblB.slice(0, -1)}${selfReference ? selfB : ''}_id,
          processed_verified
          ${byDistance ? ',calculated_distance' : ''}
        )
        SELECT
          a.id aid,
          b.id bid,
          NOW()
          ${byDistance ? distance : ''}
        FROM ${tblA} a
        INNER JOIN ${tblB} b ON
          ${geometryClause}
          ${selfReference ? 'AND b.id <> a.id' : ''}
        WHERE
          a.id = ANY(:ids)
        ORDER BY
          a.id
        ON CONFLICT DO NOTHING
      `, { ids });

      return status.rowCount;
    }
  }

  return 0;
}


async function updateProccessedTimestamp() {
  // eslint-disable-next-line
  for (const table of Object.keys(DOCUMENT_TABLES)) {
    if (TABLE_IDS[table].length) {
      logger.info(`Updating processed_relations_updated_at for ${table}`);
      // eslint-disable-next-line
      await knex.raw(`
        UPDATE ${table} SET processed_relations_updated_at = NOW()
        WHERE id = ANY(:ids)
      `, { ids: TABLE_IDS[table] });
    }
  }
}


async function main() {
  let rowCount = 1;

  while (rowCount > 0) {
    rowCount = 0;
    const durationId = startDuration();
    // eslint-disable-next-line
    await getIds();

    // eslint-disable-next-line
    for (const relationTable of RELATION_TABLES) {
      // eslint-disable-next-line
      rowCount += await processRelation(relationTable);
    }

    // eslint-disable-next-line
    await updateProccessedTimestamp();

    logger.info('************');
    logger.info(`Iteration done. Updated ${rowCount} rows`);
    printDuration(durationId);
    logger.info('************');
  }
}


main()
  .then((res) => {
    logger.info('ALL DONE');
    process.exit(0);
  })
  .catch((err) => {
    logger.error('UNCAUGHT ERROR');
    logger.error(err);
    logger.error(err.stack);
    process.exit(1);
  });

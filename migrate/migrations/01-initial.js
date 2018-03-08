
import CMharvest from
  '@turistforeningen/ntb-shared-counties-municipalities-harvester';

import { createLogger } from '@turistforeningen/ntb-shared-utils';


const logger = createLogger();


async function modifySearchBoostConfig(queryInterface) {
  // Set initial data
  await queryInterface.sequelize.query([
    'INSERT INTO "search_boost_config" (name, boost) VALUES',
    '  (\'search_document__area\', 1.1),',
    '  (\'search_document__cabin\', 1.5),',
    '  (\'search_document__county\', 1),',
    '  (\'search_document__municipality\', 1),',
  ].join('\n'));
}


async function modifySearchDocument(queryInterface) {
  // Add tsvector field for language nb
  await queryInterface.sequelize.query(
    'ALTER TABLE "search_document" ADD COLUMN "search_nb" TSVECTOR;',
  );

  // Add tsvector field for language gb
  await queryInterface.sequelize.query(
    'ALTER TABLE "search_document" ADD COLUMN "search_gb" TSVECTOR;',
  );

  // Add tsvector field for language sme
  await queryInterface.sequelize.query(
    'ALTER TABLE "search_document" ADD COLUMN "search_sme" TSVECTOR;',
  );

  // Add index to tsvector field for language nb
  await queryInterface.sequelize.query([
    'CREATE INDEX search_document_search_nb_idx ON "search_document"',
    'USING gin("search_nb");',
  ].join('\n'));

  // Add index to tsvector field for language gb
  await queryInterface.sequelize.query([
    'CREATE INDEX search_document_search_gb_idx ON "search_document"',
    'USING gin("search_gb");',
  ].join('\n'));

  // Add index to tsvector field for language sme
  await queryInterface.sequelize.query([
    'CREATE INDEX search_document_search_sme_idx ON "search_document"',
    'USING gin("search_sme");',
  ].join('\n'));
}


async function modifyTagRelation(queryInterface) {
  // Create composite primary keys
  await queryInterface.sequelize.query([
    'ALTER TABLE "tag_relation"',
    'ADD CONSTRAINT "tag_relation_primary" PRIMARY KEY (',
    '  "tag_name", "tagged_type", "tagged_uuid"',
    ')',
  ].join('\n'));
}


async function modifyAreaToArea(queryInterface) {
  // Create composite primary keys
  await queryInterface.sequelize.query([
    'ALTER TABLE "area_to_area"',
    'ADD CONSTRAINT "area_to_area_primary" PRIMARY KEY (',
    '  "parent_uuid", "child_uuid"',
    ')',
  ].join('\n'));
}


async function modifyAreaToCounty(queryInterface) {
  // Create composite primary keys
  await queryInterface.sequelize.query([
    'ALTER TABLE "area_to_county"',
    'ADD CONSTRAINT "area_to_county_primary" PRIMARY KEY (',
    '  "area_uuid", "county_uuid"',
    ')',
  ].join('\n'));
}


async function modifyAreaToMunicipality(queryInterface) {
  // Create composite primary keys
  await queryInterface.sequelize.query([
    'ALTER TABLE "area_to_municipality"',
    'ADD CONSTRAINT "area_to_municipality_primary" PRIMARY KEY (',
    '  "area_uuid", "municipality_uuid"',
    ')',
  ].join('\n'));
}


async function modifyArea(queryInterface) {
  const vectorName = 'search';

  // Add tsvector field
  await queryInterface.sequelize.query([
    'ALTER TABLE "area"',
    `ADD COLUMN "${vectorName}" TSVECTOR;`,
  ].join('\n'));

  // Add index to tsvector field
  await queryInterface.sequelize.query([
    'CREATE INDEX area_search_idx ON "area"',
    `USING gin("${vectorName}");`,
  ].join('\n'));

  // Create tsvector trigger procedure for Area
  await queryInterface.sequelize.query([
    'CREATE FUNCTION area_tsvector_trigger() RETURNS trigger AS $$',
    'BEGIN',
    `  NEW.${vectorName} :=`,
    '    setweight(to_tsvector(',
    '      \'pg_catalog.norwegian\',',
    '       coalesce(NEW.name_lower_case, \'\')',
    '    ), \'A\') ||',
    '    setweight(to_tsvector(',
    '      \'pg_catalog.norwegian\',',
    '       coalesce(NEW.description_plain, \'\')',
    '    ), \'D\');',
    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'));

  // Create search document trigger procedure for Area
  await queryInterface.sequelize.query([
    'CREATE FUNCTION area_search_document_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  boost FLOAT;',
    'BEGIN',

    '  SELECT sbc.boost INTO boost',
    '  FROM search_boost_config AS sbc',
    '  WHERE sbc.name = \'search_document__area\';',

    '  INSERT INTO search_document (',
    '    uuid, area_uuid, search_nb, search_document_boost,',
    '    search_document_type_boost, created_at, updated_at',
    '  )',
    '  VALUES (',
    `    uuid_generate_v4(), NEW.uuid, NEW.${vectorName},`,
    '    NEW.search_document_boost, boost, NEW.created_at, NEW.updated_at',
    '  )',
    '  ON CONFLICT ("area_uuid")',
    '  DO UPDATE',
    '  SET',
    '    search_nb = EXCLUDED.search_nb,',
    '    search_document_type_boost = boost,',
    '    created_at = EXCLUDED.created_at,',
    '    updated_at = EXCLUDED.updated_at;',

    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'));

  // Use tsvector trigger before each insert or update
  await queryInterface.sequelize.query([
    'CREATE TRIGGER area_tsvector_update BEFORE INSERT OR UPDATE',
    'ON area FOR EACH ROW EXECUTE PROCEDURE area_tsvector_trigger();',
  ].join('\n'));

  // Use search document trigger after each insert or update
  await queryInterface.sequelize.query([
    'CREATE TRIGGER area_search_document_update AFTER INSERT OR UPDATE',
    'ON area',
    'FOR EACH ROW EXECUTE PROCEDURE area_search_document_trigger();',
  ].join('\n'));
}


async function harvestCountiesAndMunicipalities() {
  // Harvest counties and municipalities from kartverket
  await CMharvest()
    .then((status) => {
      if (status) {
        logger.info('CM Harvester: Done with success!');
      }
      else {
        logger.error('CM Harvester: Done with error!');
        throw new Error('CM harvester reported failure');
      }
    })
    .catch((err) => {
      logger.error('UNCAUGHT ERROR');
      logger.error(err.stack);
      throw err;
    });
}


const up = async (db) => {
  logger.info('Sync database');
  await db.sequelize.sync();

  const queryInterface = db.sequelize.getQueryInterface();

  await modifySearchBoostConfig(queryInterface);
  await modifySearchDocument(queryInterface);
  await modifyTagRelation(queryInterface);
  await modifyAreaToArea(queryInterface);
  await modifyAreaToCounty(queryInterface);
  await modifyAreaToMunicipality(queryInterface);
  await modifyArea(queryInterface);

  // Harvest counties and municipalities from kartverket
  await harvestCountiesAndMunicipalities();

  logger.info('Done!');
};


const down = async (db) => {
  logger.info('Unset all the things');
  const sqls = [];
  Object.keys(db.sequelize.models).forEach((modelName) => {
    const { tableName } = db.sequelize.models[modelName];
    sqls.push(
      `DROP TABLE IF EXISTS "${tableName}" CASCADE;`,
    );
  });

  sqls.push('DROP FUNCTION IF EXISTS area_tsvector_trigger();');
  sqls.push('DROP FUNCTION IF EXISTS area_search_document_trigger();');
  sqls.push('DROP TRIGGER IF EXISTS area_tsvector_update ON area;');
  sqls.push('DROP TRIGGER IF EXISTS area_search_document_update ON area;');

  await db.sequelize.query(
    sqls.join('\n')
  );
  logger.info('Done!');
};


module.exports = { up, down };

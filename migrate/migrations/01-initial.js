
import CMharvest from
  '@turistforeningen/ntb-shared-counties-municipalities-harvester';

import { createLogger } from '@turistforeningen/ntb-shared-utils';


const logger = createLogger();


async function modifySearchBoostConfig(queryInterface, transaction) {
  // Set initial data
  await queryInterface.sequelize.query([
    'INSERT INTO "search_boost_config" (name, boost, weight) VALUES',
    '  (\'search_document__area\', 1.1, NULL),',
    '  (\'search_document__group\', 1, NULL),',
    '  (\'search_document__cabin\', 1.5, NULL),',
    '  (\'search_document__county\', 1, NULL),',
    '  (\'search_document__municipality\', 1, NULL),',
    '  (\'area__field__name\', NULL, \'A\'),',
    '  (\'area__field__description\', NULL, \'D\'),',
    '  (\'cabin__field__name\', NULL, \'A\'),',
    '  (\'cabin__field__description\', NULL, \'D\'),',
    '  (\'group__field__name\', NULL, \'A\'),',
    '  (\'group__field__description\', NULL, \'D\'),',
    '  (\'county__field__name\', NULL, \'A\'),',
    '  (\'municipality__field__name\', NULL, \'A\');',
  ].join('\n'), { transaction });
}


async function modifySearchDocument(queryInterface, transaction) {
  // Add tsvector field for language nb
  await queryInterface.sequelize.query(
    'ALTER TABLE "search_document" ADD COLUMN "search_nb" TSVECTOR;',
    { transaction }
  );

  // Add tsvector field for language gb
  await queryInterface.sequelize.query(
    'ALTER TABLE "search_document" ADD COLUMN "search_en" TSVECTOR;',
    { transaction }
  );

  // Add index to tsvector field for language nb
  await queryInterface.sequelize.query([
    'CREATE INDEX search_document_search_nb_idx ON "search_document"',
    'USING gin("search_nb");',
  ].join('\n'), { transaction });

  // Add index to tsvector field for language gb
  await queryInterface.sequelize.query([
    'CREATE INDEX search_document_search_en_idx ON "search_document"',
    'USING gin("search_en");',
  ].join('\n'), { transaction });
}


async function modifyTagRelation(queryInterface, transaction) {
  // Create composite primary keys
  await queryInterface.sequelize.query([
    'ALTER TABLE "tag_relation"',
    'ADD CONSTRAINT "tag_relation_primary" PRIMARY KEY (',
    '  "tag_name", "tagged_type", "tagged_uuid"',
    ')',
  ].join('\n'), { transaction });
}


async function modifyAreaToArea(queryInterface, transaction) {
  // Create composite primary keys
  await queryInterface.sequelize.query([
    'ALTER TABLE "area_to_area"',
    'ADD CONSTRAINT "area_to_area_primary" PRIMARY KEY (',
    '  "parent_uuid", "child_uuid"',
    ')',
  ].join('\n'), { transaction });
}


async function modifyAreaToCounty(queryInterface, transaction) {
  // Create composite primary keys
  await queryInterface.sequelize.query([
    'ALTER TABLE "area_to_county"',
    'ADD CONSTRAINT "area_to_county_primary" PRIMARY KEY (',
    '  "area_uuid", "county_uuid"',
    ')',
  ].join('\n'), { transaction });
}


async function modifyAreaToMunicipality(queryInterface, transaction) {
  // Create composite primary keys
  await queryInterface.sequelize.query([
    'ALTER TABLE "area_to_municipality"',
    'ADD CONSTRAINT "area_to_municipality_primary" PRIMARY KEY (',
    '  "area_uuid", "municipality_uuid"',
    ')',
  ].join('\n'), { transaction });
}


async function modifyArea(queryInterface, transaction) {
  // Add tsvector field
  await queryInterface.sequelize.query([
    'ALTER TABLE "area"',
    'ADD COLUMN "search_nb" TSVECTOR;',
  ].join('\n'), { transaction });

  // Add index to tsvector field
  await queryInterface.sequelize.query([
    'CREATE INDEX area_search_idx ON "area"',
    'USING gin("search_nb");',
  ].join('\n'), { transaction });

  // Create tsvector trigger procedure for Area
  await queryInterface.sequelize.query([
    'CREATE FUNCTION area_tsvector_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  name_weight CHAR;',
    '  description_weight CHAR;',
    'BEGIN',
    '  SELECT sbc."weight" INTO name_weight',
    '  FROM "search_boost_config" AS sbc',
    '  WHERE sbc.name = \'area__field__name\';',
    '',
    '  SELECT sbc."weight" INTO description_weight',
    '  FROM "search_boost_config" AS sbc',
    '  WHERE sbc.name = \'area__field__description\';',
    '',
    '  NEW.search_nb :=',
    '    setweight(to_tsvector(',
    '      \'pg_catalog.norwegian\',',
    '       coalesce(NEW.name_lower_case, \'\')',
    '    ), name_weight::"char") ||',
    '    setweight(to_tsvector(',
    '      \'pg_catalog.norwegian\',',
    '       coalesce(NEW.description_plain, \'\')',
    '    ), description_weight::"char");',
    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'), { transaction });

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
    '    uuid, area_uuid, status, search_nb, search_document_boost,',
    '    search_document_type_boost, created_at, updated_at',
    '  )',
    '  VALUES (',
    '    uuid_generate_v4(), NEW.uuid, NEW.status, NEW.search_nb,',
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
  ].join('\n'), { transaction });

  // Use tsvector trigger before each insert or update
  await queryInterface.sequelize.query([
    'CREATE TRIGGER area_tsvector_update BEFORE INSERT OR UPDATE',
    'ON "area" FOR EACH ROW EXECUTE PROCEDURE area_tsvector_trigger();',
  ].join('\n'), { transaction });

  // Use search document trigger after each insert or update
  await queryInterface.sequelize.query([
    'CREATE TRIGGER area_search_document_update AFTER INSERT OR UPDATE',
    'ON "area"',
    'FOR EACH ROW EXECUTE PROCEDURE area_search_document_trigger();',
  ].join('\n'), { transaction });
}


async function modifyGroup(queryInterface, transaction) {
  // Add tsvector field
  await queryInterface.sequelize.query([
    'ALTER TABLE "group"',
    'ADD COLUMN "search_nb" TSVECTOR;',
  ].join('\n'), { transaction });

  // Add index to tsvector field
  await queryInterface.sequelize.query([
    'CREATE INDEX group_search_idx ON "group"',
    'USING gin("search_nb");',
  ].join('\n'), { transaction });

  // Create tsvector trigger procedure for Area
  await queryInterface.sequelize.query([
    'CREATE FUNCTION group_tsvector_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  name_weight CHAR;',
    '  description_weight CHAR;',
    'BEGIN',
    '  SELECT sbc."weight" INTO name_weight',
    '  FROM "search_boost_config" AS sbc',
    '  WHERE sbc.name = \'group__field__name\';',
    '',
    '  SELECT sbc."weight" INTO description_weight',
    '  FROM "search_boost_config" AS sbc',
    '  WHERE sbc.name = \'group__field__description\';',
    '',
    '  NEW.search_nb :=',
    '    setweight(to_tsvector(',
    '      \'pg_catalog.norwegian\',',
    '       coalesce(NEW.name_lower_case, \'\')',
    '    ), name_weight::"char") ||',
    '    setweight(to_tsvector(',
    '      \'pg_catalog.norwegian\',',
    '       coalesce(NEW.description_plain, \'\')',
    '    ), description_weight::"char");',
    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'), { transaction });

  // Create search document trigger procedure for Area
  await queryInterface.sequelize.query([
    'CREATE FUNCTION group_search_document_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  boost FLOAT;',
    'BEGIN',

    '  SELECT sbc.boost INTO boost',
    '  FROM search_boost_config AS sbc',
    '  WHERE sbc.name = \'search_document__group\';',

    '  INSERT INTO search_document (',
    '    uuid, group_uuid, status, search_nb, search_document_boost,',
    '    search_document_type_boost, created_at, updated_at',
    '  )',
    '  VALUES (',
    '    uuid_generate_v4(), NEW.uuid, NEW.status, NEW.search_nb,',
    '    NEW.search_document_boost, boost, NEW.created_at, NEW.updated_at',
    '  )',
    '  ON CONFLICT ("group_uuid")',
    '  DO UPDATE',
    '  SET',
    '    search_nb = EXCLUDED.search_nb,',
    '    search_document_type_boost = boost,',
    '    created_at = EXCLUDED.created_at,',
    '    updated_at = EXCLUDED.updated_at;',

    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'), { transaction });

  // Use tsvector trigger before each insert or update
  await queryInterface.sequelize.query([
    'CREATE TRIGGER group_tsvector_update BEFORE INSERT OR UPDATE',
    'ON "group" FOR EACH ROW EXECUTE PROCEDURE group_tsvector_trigger();',
  ].join('\n'), { transaction });

  // Use search document trigger after each insert or update
  await queryInterface.sequelize.query([
    'CREATE TRIGGER group_search_document_update AFTER INSERT OR UPDATE',
    'ON "group"',
    'FOR EACH ROW EXECUTE PROCEDURE group_search_document_trigger();',
  ].join('\n'), { transaction });
}


async function modifyCounty(queryInterface, transaction) {
  // Create search document trigger procedure for Area
  await queryInterface.sequelize.query([
    'CREATE FUNCTION county_search_document_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  name_weight CHAR;',
    '  boost FLOAT;',
    '  vector TSVECTOR;',
    'BEGIN',

    '  SELECT sbc."weight" INTO name_weight',
    '  FROM "search_boost_config" AS sbc',
    '  WHERE sbc."name" = \'county__field__name\';',

    '  SELECT sbc.boost INTO boost',
    '  FROM "search_boost_config" AS sbc',
    '  WHERE sbc."name" = \'search_document__county\';',

    '  vector :=',
    '    setweight(to_tsvector(',
    '      \'pg_catalog.norwegian\',',
    '       coalesce(NEW.name_lower_case, \'\')',
    '    ), name_weight::"char");',

    '  INSERT INTO search_document (',
    '    uuid, county_uuid, status, search_nb, search_document_boost,',
    '    search_document_type_boost, created_at, updated_at',
    '  )',
    '  VALUES (',
    '    uuid_generate_v4(), NEW.uuid, NEW.status, vector,',
    '    1, boost, NEW.created_at, NEW.updated_at',
    '  )',
    '  ON CONFLICT ("county_uuid")',
    '  DO UPDATE',
    '  SET',
    '    search_nb = vector,',
    '    search_document_type_boost = boost,',
    '    created_at = EXCLUDED.created_at,',
    '    updated_at = EXCLUDED.updated_at;',

    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'), { transaction });

  // Use search document trigger after each insert or update
  await queryInterface.sequelize.query([
    'CREATE TRIGGER county_search_document_update AFTER INSERT OR UPDATE',
    'ON "county"',
    'FOR EACH ROW EXECUTE PROCEDURE county_search_document_trigger();',
  ].join('\n'), { transaction });
}


async function modifyMunicipality(queryInterface, transaction) {
  // Create search document trigger procedure for Area
  await queryInterface.sequelize.query([
    'CREATE FUNCTION municipality_search_document_trigger()',
    'RETURNS trigger AS $$',
    'DECLARE',
    '  name_weight CHAR;',
    '  boost FLOAT;',
    '  vector TSVECTOR;',
    'BEGIN',

    '  SELECT sbc."weight" INTO name_weight',
    '  FROM "search_boost_config" AS sbc',
    '  WHERE sbc."name" = \'municipality__field__name\';',

    '  SELECT sbc.boost INTO boost',
    '  FROM search_boost_config AS sbc',
    '  WHERE sbc.name = \'search_document__municipality\';',

    '  vector :=',
    '    setweight(to_tsvector(',
    '      \'pg_catalog.norwegian\',',
    '       coalesce(NEW.name_lower_case, \'\')',
    '    ), name_weight::"char");',

    '  INSERT INTO search_document (',
    '    uuid, municipality_uuid, status, search_nb, search_document_boost,',
    '    search_document_type_boost, created_at, updated_at',
    '  )',
    '  VALUES (',
    '    uuid_generate_v4(), NEW.uuid, NEW.status, vector,',
    '    1, boost, NEW.created_at, NEW.updated_at',
    '  )',
    '  ON CONFLICT ("municipality_uuid")',
    '  DO UPDATE',
    '  SET',
    '    search_nb = vector,',
    '    search_document_type_boost = boost,',
    '    created_at = EXCLUDED.created_at,',
    '    updated_at = EXCLUDED.updated_at;',

    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'), { transaction });

  // Use search document trigger after each insert or update
  await queryInterface.sequelize.query([
    'CREATE TRIGGER municipality_search_document_update',
    'AFTER INSERT OR UPDATE ON "municipality"',
    'FOR EACH ROW EXECUTE PROCEDURE municipality_search_document_trigger();',
  ].join('\n'), { transaction });
}


async function modifyCabin(queryInterface, transaction) {
  // Add tsvector field for norwegian
  await queryInterface.sequelize.query([
    'ALTER TABLE "cabin"',
    'ADD COLUMN "search_nb" TSVECTOR,',
    'ADD COLUMN "search_en" TSVECTOR;',
  ].join('\n'), { transaction });

  // Add index to tsvector field
  await queryInterface.sequelize.query([
    'CREATE INDEX cabin_search_nb_idx ON "cabin"',
    'USING gin("search_nb");',
  ].join('\n'), { transaction });
  await queryInterface.sequelize.query([
    'CREATE INDEX cabin_search_en_idx ON "cabin"',
    'USING gin("search_en");',
  ].join('\n'), { transaction });

  // Create tsvector trigger procedure for updating the norwegian vector
  await queryInterface.sequelize.query([
    'CREATE FUNCTION cabin_tsvector_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  name_weight CHAR;',
    '  description_weight CHAR;',
    'BEGIN',
    '  SELECT sbc."weight" INTO name_weight',
    '  FROM "search_boost_config" AS sbc',
    '  WHERE sbc.name = \'cabin__field__name\';',
    '',
    '  SELECT sbc."weight" INTO description_weight',
    '  FROM "search_boost_config" AS sbc',
    '  WHERE sbc.name = \'cabin__field__description\';',
    '',
    '  NEW.search_nb :=',
    '    setweight(to_tsvector(',
    '      \'pg_catalog.norwegian\',',
    '       coalesce(NEW.name_lower_case, \'\')',
    '    ), name_weight::"char") ||',
    '    setweight(to_tsvector(',
    '      \'pg_catalog.norwegian\',',
    '       coalesce(NEW.description_plain, \'\')',
    '    ), description_weight::"char");',
    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'), { transaction });

  // Create search document trigger procedure for Area
  await queryInterface.sequelize.query([
    'CREATE FUNCTION cabin_search_document_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  boost FLOAT;',
    'BEGIN',

    '  SELECT sbc.boost INTO boost',
    '  FROM search_boost_config AS sbc',
    '  WHERE sbc.name = \'search_document__cabin\';',

    '  INSERT INTO search_document (',
    '    uuid, cabin_uuid, status, search_nb, search_document_boost,',
    '    search_document_type_boost, created_at, updated_at',
    '  )',
    '  VALUES (',
    '    uuid_generate_v4(), NEW.uuid, NEW.status, NEW.search_nb,',
    '    NEW.search_document_boost, boost, NEW.created_at, NEW.updated_at',
    '  )',
    '  ON CONFLICT ("cabin_uuid")',
    '  DO UPDATE',
    '  SET',
    '    search_nb = EXCLUDED.search_nb,',
    '    search_document_type_boost = boost,',
    '    created_at = EXCLUDED.created_at,',
    '    updated_at = EXCLUDED.updated_at;',

    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'), { transaction });

  // Use tsvector trigger before each insert or update
  await queryInterface.sequelize.query([
    'CREATE TRIGGER cabin_tsvector_update BEFORE INSERT OR UPDATE',
    'ON "cabin" FOR EACH ROW EXECUTE PROCEDURE cabin_tsvector_trigger();',
  ].join('\n'), { transaction });

  // Use search document trigger after each insert or update
  await queryInterface.sequelize.query([
    'CREATE TRIGGER cabin_search_document_update AFTER INSERT OR UPDATE',
    'ON "cabin"',
    'FOR EACH ROW EXECUTE PROCEDURE cabin_search_document_trigger();',
  ].join('\n'), { transaction });
}


async function modifyCabinTranslation(queryInterface, transaction) {
  // Update search document and cabin trigger procedure for update
  await queryInterface.sequelize.query([
    'CREATE FUNCTION cabin_translation_on_insert_or_update()',
    'RETURNS trigger AS $$',
    'DECLARE',
    '  name_weight CHAR;',
    '  description_weight CHAR;',
    '  vector TSVECTOR;',
    'BEGIN',

    '  IF NEW.language = \'en\' THEN',
    '    SELECT sbc."weight" INTO name_weight',
    '    FROM "search_boost_config" AS sbc',
    '    WHERE sbc.name = \'cabin__field__name\';',
    '',
    '    SELECT sbc."weight" INTO description_weight',
    '    FROM "search_boost_config" AS sbc',
    '    WHERE sbc.name = \'cabin__field__description\';',
    '',
    '    vector :=',
    '      setweight(to_tsvector(',
    '        \'pg_catalog.english\',',
    '         coalesce(NEW.name_lower_case, \'\')',
    '      ), name_weight::"char") ||',
    '      setweight(to_tsvector(',
    '        \'pg_catalog.english\',',
    '         coalesce(NEW.description_plain, \'\')',
    '      ), description_weight::"char");',

    '    UPDATE "search_document" SET',
    '      "search_en" = vector',
    '    WHERE',
    '      "cabin_uuid" = NEW.cabin_uuid;',

    '    UPDATE "cabin" SET',
    '      "search_en" = vector',
    '    WHERE',
    '      "uuid" = NEW.cabin_uuid;',
    '  END IF;',

    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'), { transaction });

  // Update search document and cabin trigger procedure for delete
  await queryInterface.sequelize.query([
    'CREATE FUNCTION cabin_translation_on_delete()',
    'RETURNS trigger AS $$',
    'BEGIN',

    '  IF OLD.language = \'en\' THEN',
    '    UPDATE "search_document" SET',
    '      "search_en" = NULL',
    '    WHERE',
    '      "cabin_uuid" = OLD.cabin_uuid;',

    '    UPDATE "cabin" SET',
    '      "search_en" = NULL',
    '    WHERE',
    '      "uuid" = OLD.cabin_uuid;',
    '  END IF;',

    '  RETURN OLD;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'), { transaction });

  // Use tsvector trigger before each insert or update
  await queryInterface.sequelize.query([
    'CREATE TRIGGER cabin_translation_update_trigger',
    'AFTER INSERT OR UPDATE ON "cabin_translation"',
    'FOR EACH ROW EXECUTE PROCEDURE',
    'cabin_translation_on_insert_or_update();',
  ].join('\n'), { transaction });

  // Use tsvector trigger before each delete
  await queryInterface.sequelize.query([
    'CREATE TRIGGER cabin_translation_delete_trigger',
    'BEFORE DELETE ON "cabin_translation"',
    'FOR EACH ROW EXECUTE PROCEDURE',
    'cabin_translation_on_delete();',
  ].join('\n'), { transaction });
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


const down = async (db) => {
  logger.info('Unset all the things');
  const sqls = [];
  Object.keys(db.sequelize.models).forEach((modelName) => {
    const { tableName } = db.sequelize.models[modelName];
    if (tableName !== 'sequelize_meta') {
      sqls.push(
        `DROP TABLE IF EXISTS "public"."${tableName}" CASCADE;`,
      );
    }
  });

  sqls.push('DROP TRIGGER IF EXISTS area_tsvector_update ON "area";');
  sqls.push('DROP TRIGGER IF EXISTS area_search_document_update ON "area";');
  sqls.push('DROP FUNCTION IF EXISTS area_tsvector_trigger();');
  sqls.push('DROP FUNCTION IF EXISTS area_search_document_trigger();');

  sqls.push('DROP TRIGGER IF EXISTS group_tsvector_update ON "group";');
  sqls.push('DROP TRIGGER IF EXISTS group_search_document_update ON "group";');
  sqls.push('DROP FUNCTION IF EXISTS group_tsvector_trigger();');
  sqls.push('DROP FUNCTION IF EXISTS group_search_document_trigger();');

  sqls.push(
    'DROP TRIGGER IF EXISTS county_search_document_update ON "county";'
  );
  sqls.push('DROP FUNCTION IF EXISTS county_search_document_trigger();');

  sqls.push(
    'DROP TRIGGER IF EXISTS municipality_search_document_update ' +
    'ON "municipality";'
  );
  sqls.push('DROP FUNCTION IF EXISTS municipality_search_document_trigger();');

  sqls.push('DROP TRIGGER IF EXISTS cabin_tsvector_update ON "cabin";');
  sqls.push('DROP TRIGGER IF EXISTS cabin_search_document_update ON "cabin";');
  sqls.push('DROP FUNCTION IF EXISTS cabin_tsvector_trigger();');
  sqls.push('DROP FUNCTION IF EXISTS cabin_search_document_trigger();');

  sqls.push(
    'DROP TRIGGER IF EXISTS cabin_translation_update_trigger ON ' +
    '"cabin_translation";'
  );
  sqls.push(
    'DROP TRIGGER IF EXISTS cabin_translation_delete_trigger ' +
    'ON "cabin_translation";'
  );
  sqls.push(
    'DROP FUNCTION IF EXISTS cabin_translation_on_insert_or_update();'
  );
  sqls.push('DROP FUNCTION IF EXISTS cabin_translation_on_delete();');

  await db.sequelize.query(
    sqls.join('\n')
  );
  logger.info('Done!');
};


const up = async (db) => {
  logger.info('Sync database');

  await db.sequelize.sync();
  const queryInterface = db.sequelize.getQueryInterface();

  await queryInterface.sequelize.transaction(async (transaction) => {
    await modifySearchBoostConfig(queryInterface, transaction);
    await modifySearchDocument(queryInterface, transaction);
    await modifyTagRelation(queryInterface, transaction);
    await modifyAreaToArea(queryInterface, transaction);
    await modifyAreaToCounty(queryInterface, transaction);
    await modifyAreaToMunicipality(queryInterface, transaction);
    await modifyArea(queryInterface, transaction);
    await modifyGroup(queryInterface, transaction);
    await modifyCounty(queryInterface, transaction);
    await modifyMunicipality(queryInterface, transaction);
    await modifyCabin(queryInterface, transaction);
    await modifyCabinTranslation(queryInterface, transaction);
  }).catch((err) => {
    logger.error('TRANSACTION ERROR');
    logger.error(err);
    down(db);
    throw err;
  });

  // Harvest counties and municipalities from kartverket
  await harvestCountiesAndMunicipalities();

  logger.info('Done!');
};


module.exports = { up, down };

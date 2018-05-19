import fs from 'fs';
import path from 'path';

import CMharvest from
  '@turistforeningen/ntb-shared-counties-municipalities-harvester';

import { createLogger } from '@turistforeningen/ntb-shared-utils';


const logger = createLogger();


async function modifySearchConfig(queryInterface, transaction) {
  // Set initial data
  await queryInterface.sequelize.query([
    'INSERT INTO "search_config" (name, boost, weight) VALUES',
    '  (\'search_document__area\', 1.1, NULL),',
    '  (\'search_document__group\', 1, NULL),',
    '  (\'search_document__cabin\', 1.5, NULL),',
    '  (\'search_document__poi\', 1.5, NULL),',
    '  (\'search_document__trip\', 1.5, NULL),',
    '  (\'search_document__route\', 1.5, NULL),',
    '  (\'search_document__county\', 1, NULL),',
    '  (\'search_document__municipality\', 1, NULL),',
    '  (\'search_document__list\', 1, NULL),',
    '  (\'area__field__name\', NULL, \'A\'),',
    '  (\'area__field__description\', NULL, \'D\'),',
    '  (\'cabin__field__name\', NULL, \'A\'),',
    '  (\'cabin__field__description\', NULL, \'D\'),',
    '  (\'poi__field__name\', NULL, \'A\'),',
    '  (\'poi__field__description\', NULL, \'D\'),',
    '  (\'trip__field__name\', NULL, \'A\'),',
    '  (\'trip__field__description\', NULL, \'D\'),',
    '  (\'route__field__name\', NULL, \'A\'),',
    '  (\'route__field__description\', NULL, \'C\'),',
    '  (\'route__field__description_direction\', NULL, \'D\'),',
    '  (\'group__field__name\', NULL, \'A\'),',
    '  (\'group__field__description\', NULL, \'D\'),',
    '  (\'list__field__name\', NULL, \'A\'),',
    '  (\'list__field__description\', NULL, \'D\'),',
    '  (\'county__field__name\', NULL, \'A\'),',
    '  (\'municipality__field__name\', NULL, \'A\');',
  ].join('\n'), { transaction });
}


async function modifyCabinOpeningHoursKeyType(queryInterface, transaction) {
  // Set initial data
  await queryInterface.sequelize.query([
    'INSERT INTO "cabin_opening_hours_key_type" (name) VALUES',
    '  (\'unlocked\'),',
    '  (\'dnt-key\'),',
    '  (\'special key\');',
  ].join('\n'), { transaction });
}


async function modifyDocumentStatus(queryInterface, transaction) {
  // Set initial data
  await queryInterface.sequelize.query([
    'INSERT INTO "document_status" (name) VALUES',
    '  (\'private\'),',
    '  (\'draft\'),',
    '  (\'deleted\'),',
    '  (\'public\');',
  ].join('\n'), { transaction });
}


async function modifyCabinPictureType(queryInterface, transaction) {
  // Set initial data
  await queryInterface.sequelize.query([
    'INSERT INTO "cabin_picture_type" (name) VALUES',
    '  (\'summer\'),',
    '  (\'winter\'),',
    '  (\'interior\'),',
    '  (\'other\');',
  ].join('\n'), { transaction });
}


async function modifyGrading(queryInterface, transaction) {
  // Set initial data
  await queryInterface.sequelize.query([
    'INSERT INTO "grading" (name) VALUES',
    '  (\'easy\'),',
    '  (\'moderate\'),',
    '  (\'tough\'),',
    '  (\'very tough\');',
  ].join('\n'), { transaction });
}


async function modifyTripDirection(queryInterface, transaction) {
  // Set initial data
  await queryInterface.sequelize.query([
    'INSERT INTO "trip_direction" (name) VALUES',
    '  (\'ab\'),',
    '  (\'aba\');',
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
    '  FROM "search_config" AS sbc',
    '  WHERE sbc.name = \'area__field__name\';',
    '',
    '  SELECT sbc."weight" INTO description_weight',
    '  FROM "search_config" AS sbc',
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
    '  FROM search_config AS sbc',
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
    '  FROM "search_config" AS sbc',
    '  WHERE sbc.name = \'group__field__name\';',
    '',
    '  SELECT sbc."weight" INTO description_weight',
    '  FROM "search_config" AS sbc',
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
    '  FROM search_config AS sbc',
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
    '  FROM "search_config" AS sbc',
    '  WHERE sbc."name" = \'county__field__name\';',

    '  SELECT sbc.boost INTO boost',
    '  FROM "search_config" AS sbc',
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
    '  FROM "search_config" AS sbc',
    '  WHERE sbc."name" = \'municipality__field__name\';',

    '  SELECT sbc.boost INTO boost',
    '  FROM search_config AS sbc',
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
    '  FROM "search_config" AS sbc',
    '  WHERE sbc.name = \'cabin__field__name\';',
    '',
    '  SELECT sbc."weight" INTO description_weight',
    '  FROM "search_config" AS sbc',
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
    '  FROM search_config AS sbc',
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
    '    FROM "search_config" AS sbc',
    '    WHERE sbc.name = \'cabin__field__name\';',
    '',
    '    SELECT sbc."weight" INTO description_weight',
    '    FROM "search_config" AS sbc',
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


async function modifyPoi(queryInterface, transaction) {
  // Add tsvector field for norwegian
  await queryInterface.sequelize.query([
    'ALTER TABLE "poi"',
    'ADD COLUMN "search_nb" TSVECTOR;',
  ].join('\n'), { transaction });

  // Add index to tsvector field
  await queryInterface.sequelize.query([
    'CREATE INDEX poi_search_nb_idx ON "poi"',
    'USING gin("search_nb");',
  ].join('\n'), { transaction });

  // Create tsvector trigger procedure for updating the norwegian vector
  await queryInterface.sequelize.query([
    'CREATE FUNCTION poi_tsvector_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  name_weight CHAR;',
    '  description_weight CHAR;',
    'BEGIN',
    '  SELECT sbc."weight" INTO name_weight',
    '  FROM "search_config" AS sbc',
    '  WHERE sbc.name = \'poi__field__name\';',
    '',
    '  SELECT sbc."weight" INTO description_weight',
    '  FROM "search_config" AS sbc',
    '  WHERE sbc.name = \'poi__field__description\';',
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
    'CREATE FUNCTION poi_search_document_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  boost FLOAT;',
    'BEGIN',

    '  SELECT sbc.boost INTO boost',
    '  FROM search_config AS sbc',
    '  WHERE sbc.name = \'search_document__poi\';',

    '  INSERT INTO search_document (',
    '    uuid, poi_uuid, status, search_nb, search_document_boost,',
    '    search_document_type_boost, created_at, updated_at',
    '  )',
    '  VALUES (',
    '    uuid_generate_v4(), NEW.uuid, NEW.status, NEW.search_nb,',
    '    NEW.search_document_boost, boost, NEW.created_at, NEW.updated_at',
    '  )',
    '  ON CONFLICT ("poi_uuid")',
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
    'CREATE TRIGGER poi_tsvector_update BEFORE INSERT OR UPDATE',
    'ON "poi" FOR EACH ROW EXECUTE PROCEDURE poi_tsvector_trigger();',
  ].join('\n'), { transaction });

  // Use search document trigger after each insert or update
  await queryInterface.sequelize.query([
    'CREATE TRIGGER poi_search_document_update AFTER INSERT OR UPDATE',
    'ON "poi"',
    'FOR EACH ROW EXECUTE PROCEDURE poi_search_document_trigger();',
  ].join('\n'), { transaction });
}


async function modifyTrip(queryInterface, transaction) {
  // Add tsvector field for norwegian
  await queryInterface.sequelize.query([
    'ALTER TABLE "trip"',
    'ADD COLUMN "search_nb" TSVECTOR,',
    'ADD COLUMN "search_en" TSVECTOR;',
  ].join('\n'), { transaction });

  // Add index to tsvector field
  await queryInterface.sequelize.query([
    'CREATE INDEX trip_search_nb_idx ON "trip"',
    'USING gin("search_nb");',
  ].join('\n'), { transaction });
  await queryInterface.sequelize.query([
    'CREATE INDEX trip_search_en_idx ON "trip"',
    'USING gin("search_en");',
  ].join('\n'), { transaction });

  // Create tsvector trigger procedure for updating the norwegian vector
  await queryInterface.sequelize.query([
    'CREATE FUNCTION trip_tsvector_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  name_weight CHAR;',
    '  description_weight CHAR;',
    'BEGIN',
    '  SELECT sbc."weight" INTO name_weight',
    '  FROM "search_config" AS sbc',
    '  WHERE sbc.name = \'trip__field__name\';',
    '',
    '  SELECT sbc."weight" INTO description_weight',
    '  FROM "search_config" AS sbc',
    '  WHERE sbc.name = \'trip__field__description\';',
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
    'CREATE FUNCTION trip_search_document_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  boost FLOAT;',
    'BEGIN',

    '  SELECT sbc.boost INTO boost',
    '  FROM search_config AS sbc',
    '  WHERE sbc.name = \'search_document__trip\';',

    '  INSERT INTO search_document (',
    '    uuid, trip_uuid, status, search_nb, search_document_boost,',
    '    search_document_type_boost, created_at, updated_at',
    '  )',
    '  VALUES (',
    '    uuid_generate_v4(), NEW.uuid, NEW.status, NEW.search_nb,',
    '    NEW.search_document_boost, boost, NEW.created_at, NEW.updated_at',
    '  )',
    '  ON CONFLICT ("trip_uuid")',
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
    'CREATE TRIGGER trip_tsvector_update BEFORE INSERT OR UPDATE',
    'ON "trip" FOR EACH ROW EXECUTE PROCEDURE trip_tsvector_trigger();',
  ].join('\n'), { transaction });

  // Use search document trigger after each insert or update
  await queryInterface.sequelize.query([
    'CREATE TRIGGER trip_search_document_update AFTER INSERT OR UPDATE',
    'ON "trip"',
    'FOR EACH ROW EXECUTE PROCEDURE trip_search_document_trigger();',
  ].join('\n'), { transaction });
}


async function modifyRoute(queryInterface, transaction) {
  // Add tsvector field for norwegian
  await queryInterface.sequelize.query([
    'ALTER TABLE "route"',
    'ADD COLUMN "search_nb" TSVECTOR,',
    'ADD COLUMN "search_en" TSVECTOR;',
  ].join('\n'), { transaction });

  // Add index to tsvector field
  await queryInterface.sequelize.query([
    'CREATE INDEX route_search_nb_idx ON "route"',
    'USING gin("search_nb");',
  ].join('\n'), { transaction });
  await queryInterface.sequelize.query([
    'CREATE INDEX route_search_en_idx ON "route"',
    'USING gin("search_en");',
  ].join('\n'), { transaction });

  // Create tsvector trigger procedure for updating the norwegian vector
  await queryInterface.sequelize.query([
    'CREATE FUNCTION route_tsvector_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  name_weight CHAR;',
    '  description_weight CHAR;',
    '  description_direction_weight CHAR;',
    'BEGIN',
    '  SELECT sbc."weight" INTO name_weight',
    '  FROM "search_config" AS sbc',
    '  WHERE sbc.name = \'route__field__name\';',
    '',
    '  SELECT sbc."weight" INTO description_weight',
    '  FROM "search_config" AS sbc',
    '  WHERE sbc.name = \'route__field__description\';',
    '',
    '  SELECT sbc."weight" INTO description_direction_weight',
    '  FROM "search_config" AS sbc',
    '  WHERE sbc.name = \'route__field__description_direction\';',
    '',
    '  NEW.search_nb :=',
    '    setweight(to_tsvector(',
    '      \'pg_catalog.norwegian\',',
    '       coalesce(NEW.name_lower_case, \'\')',
    '    ), name_weight::"char") ||',
    '    setweight(to_tsvector(',
    '      \'pg_catalog.norwegian\',',
    '       coalesce(NEW.description_plain, \'\')',
    '    ), description_weight::"char") ||',
    '    setweight(to_tsvector(',
    '      \'pg_catalog.norwegian\',',
    '       coalesce(NEW.description_ab_plain, \'\')',
    '    ), description_direction_weight::"char") ||',
    '    setweight(to_tsvector(',
    '      \'pg_catalog.norwegian\',',
    '       coalesce(NEW.description_ba_plain, \'\')',
    '    ), description_direction_weight::"char");',
    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'), { transaction });

  // Create search document trigger procedure for Area
  await queryInterface.sequelize.query([
    'CREATE FUNCTION route_search_document_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  boost FLOAT;',
    'BEGIN',

    '  SELECT sbc.boost INTO boost',
    '  FROM search_config AS sbc',
    '  WHERE sbc.name = \'search_document__route\';',

    '  INSERT INTO search_document (',
    '    uuid, route_uuid, status, search_nb, search_document_boost,',
    '    search_document_type_boost, created_at, updated_at',
    '  )',
    '  VALUES (',
    '    uuid_generate_v4(), NEW.uuid, NEW.status, NEW.search_nb,',
    '    NEW.search_document_boost, boost, NEW.created_at, NEW.updated_at',
    '  )',
    '  ON CONFLICT ("route_uuid")',
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
    'CREATE TRIGGER route_tsvector_update BEFORE INSERT OR UPDATE',
    'ON "route" FOR EACH ROW EXECUTE PROCEDURE route_tsvector_trigger();',
  ].join('\n'), { transaction });

  // Use search document trigger after each insert or update
  await queryInterface.sequelize.query([
    'CREATE TRIGGER route_search_document_update AFTER INSERT OR UPDATE',
    'ON "route"',
    'FOR EACH ROW EXECUTE PROCEDURE route_search_document_trigger();',
  ].join('\n'), { transaction });
}


async function modifyPoiToPoiType(queryInterface, transaction) {
  // Update unique key
  await queryInterface.sequelize.query([
    'ALTER TABLE "public"."poi_to_poi_type"',
    'DROP CONSTRAINT "poi_to_poi_type_sort_index_key";',
    'ALTER TABLE "public"."poi_to_poi_type"',
    'ADD CONSTRAINT "poi_to_poi_type_sort_index_key"',
    'UNIQUE ("sort_index","poi_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;',
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


async function modifyList(queryInterface, transaction) {
  // Add tsvector field for norwegian
  await queryInterface.sequelize.query([
    'ALTER TABLE "list"',
    'ADD COLUMN "search_nb" TSVECTOR;',
  ].join('\n'), { transaction });

  // Add index to tsvector field
  await queryInterface.sequelize.query([
    'CREATE INDEX list_search_nb_idx ON "list"',
    'USING gin("search_nb");',
  ].join('\n'), { transaction });

  // Create tsvector trigger procedure for updating the norwegian vector
  await queryInterface.sequelize.query([
    'CREATE FUNCTION list_tsvector_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  name_weight CHAR;',
    '  description_weight CHAR;',
    'BEGIN',
    '  SELECT sbc."weight" INTO name_weight',
    '  FROM "search_config" AS sbc',
    '  WHERE sbc.name = \'list__field__name\';',
    '',
    '  SELECT sbc."weight" INTO description_weight',
    '  FROM "search_config" AS sbc',
    '  WHERE sbc.name = \'list__field__description\';',
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
    'CREATE FUNCTION list_search_document_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  boost FLOAT;',
    'BEGIN',

    '  SELECT sbc.boost INTO boost',
    '  FROM search_config AS sbc',
    '  WHERE sbc.name = \'search_document__list\';',

    '  INSERT INTO search_document (',
    '    uuid, list_uuid, status, search_nb, search_document_boost,',
    '    search_document_type_boost, created_at, updated_at',
    '  )',
    '  VALUES (',
    '    uuid_generate_v4(), NEW.uuid, NEW.status, NEW.search_nb,',
    '    NEW.search_document_boost, boost, NEW.created_at, NEW.updated_at',
    '  )',
    '  ON CONFLICT ("list_uuid")',
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
    'CREATE TRIGGER list_tsvector_update BEFORE INSERT OR UPDATE',
    'ON "list" FOR EACH ROW EXECUTE PROCEDURE list_tsvector_trigger();',
  ].join('\n'), { transaction });

  // Use search document trigger after each insert or update
  await queryInterface.sequelize.query([
    'CREATE TRIGGER list_search_document_update AFTER INSERT OR UPDATE',
    'ON "list"',
    'FOR EACH ROW EXECUTE PROCEDURE list_search_document_trigger();',
  ].join('\n'), { transaction });
}


async function modifyListType(queryInterface, transaction) {
  // Set initial data
  await queryInterface.sequelize.query([
    'INSERT INTO "list_type" (name) VALUES (\'sjekkut\');',
  ].join('\n'), { transaction });
}


async function modifyListRelation(queryInterface, transaction) {
  // Create composite primary keys
  await queryInterface.sequelize.query([
    'ALTER TABLE "list_relation"',
    'ADD CONSTRAINT "list_relation_primary" PRIMARY KEY (',
    '  "list_uuid", "document_type", "document_uuid"',
    ')',
  ].join('\n'), { transaction });
}


const down = async (db) => {
  logger.info('Unset all the things');

  const tables = [
    'accessability',
    'activity_type',
    'activity_type_to_activity_type',
    'area',
    'area_to_area',
    'area_to_county',
    'area_to_municipality',
    'cabin',
    'cabin_accessability',
    'cabin_facility',
    'cabin_link',
    'cabin_opening_hours',
    'cabin_opening_hours_key_type',
    'cabin_picture_type',
    'cabin_service_level',
    'cabin_to_area',
    'cabin_translation',
    'county',
    'county_translation',
    'document_status',
    'facility',
    'grading',
    'group',
    'group_link',
    'group_type',
    'list',
    'list_link',
    'list_relation',
    'list_to_county',
    'list_to_group',
    'list_to_municipality',
    'list_type',
    'municipality',
    'municipality_translation',
    'picture',
    'poi',
    'poi_accessability',
    'poi_link',
    'poi_to_area',
    'poi_to_group',
    'poi_to_poi_type',
    'poi_type',
    'route',
    'route_link',
    'route_to_activity_type',
    'route_to_county',
    'route_to_group',
    'route_to_poi',
    'route_to_route_waymark_type',
    'route_waymark_type',
    'search_config',
    'search_document',
    'tag',
    'tag_relation',
    'trip',
    'trip_direction',
    'trip_link',
    'trip_to_activity_type',
    'trip_to_group',
    'trip_to_poi',
    'uuid',
  ];
  const sqls = [];
  tables.forEach((tableName) => {
    sqls.push(
      `DROP TABLE IF EXISTS "public"."${tableName}" CASCADE;`,
    );
  });

  // Remove 'area' triggers
  sqls.push('DROP TRIGGER IF EXISTS area_tsvector_update ON "area";');
  sqls.push('DROP TRIGGER IF EXISTS area_search_document_update ON "area";');
  sqls.push('DROP FUNCTION IF EXISTS area_tsvector_trigger();');
  sqls.push('DROP FUNCTION IF EXISTS area_search_document_trigger();');

  // Remove 'group' triggers
  sqls.push('DROP TRIGGER IF EXISTS group_tsvector_update ON "group";');
  sqls.push('DROP TRIGGER IF EXISTS group_search_document_update ON "group";');
  sqls.push('DROP FUNCTION IF EXISTS group_tsvector_trigger();');
  sqls.push('DROP FUNCTION IF EXISTS group_search_document_trigger();');

  // Remove 'county' triggers
  sqls.push(
    'DROP TRIGGER IF EXISTS county_search_document_update ON "county";'
  );
  sqls.push('DROP FUNCTION IF EXISTS county_search_document_trigger();');

  // Remove 'municipality' triggers
  sqls.push(
    'DROP TRIGGER IF EXISTS municipality_search_document_update ' +
    'ON "municipality";'
  );
  sqls.push('DROP FUNCTION IF EXISTS municipality_search_document_trigger();');

  // Remove 'cabin' triggers
  sqls.push('DROP TRIGGER IF EXISTS cabin_tsvector_update ON "cabin";');
  sqls.push('DROP TRIGGER IF EXISTS cabin_search_document_update ON "cabin";');
  sqls.push('DROP FUNCTION IF EXISTS cabin_tsvector_trigger();');
  sqls.push('DROP FUNCTION IF EXISTS cabin_search_document_trigger();');

  // Remove 'cabin_translations' triggers
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

  // Remove 'poi' triggers
  sqls.push('DROP TRIGGER IF EXISTS poi_tsvector_update ON "poi";');
  sqls.push('DROP TRIGGER IF EXISTS poi_search_document_update ON "poi";');
  sqls.push('DROP FUNCTION IF EXISTS poi_tsvector_trigger();');
  sqls.push('DROP FUNCTION IF EXISTS poi_search_document_trigger();');

  // Remove 'trip' triggers
  sqls.push('DROP TRIGGER IF EXISTS trip_tsvector_update ON "trip";');
  sqls.push('DROP TRIGGER IF EXISTS trip_search_document_update ON "trip";');
  sqls.push('DROP FUNCTION IF EXISTS trip_tsvector_trigger();');
  sqls.push('DROP FUNCTION IF EXISTS trip_search_document_trigger();');

  // Remove 'route' triggers
  sqls.push('DROP TRIGGER IF EXISTS route_tsvector_update ON "route";');
  sqls.push('DROP TRIGGER IF EXISTS route_search_document_update ON "route";');
  sqls.push('DROP FUNCTION IF EXISTS route_tsvector_trigger();');
  sqls.push('DROP FUNCTION IF EXISTS route_search_document_trigger();');

  // Remove 'list' triggers
  sqls.push('DROP TRIGGER IF EXISTS list_tsvector_update ON "list";');
  sqls.push('DROP TRIGGER IF EXISTS list_search_document_update ON "list";');
  sqls.push('DROP FUNCTION IF EXISTS list_tsvector_trigger();');
  sqls.push('DROP FUNCTION IF EXISTS list_search_document_trigger();');

  await db.sequelize.query(
    sqls.join('\n')
  );
  logger.info('Done!');
};


const up = async (db) => {
  logger.info('Sync database');

  // await db.sequelize.sync();
  const queryInterface = db.sequelize.getQueryInterface();

  const sqlFilePath = path.resolve(__dirname, 'assets', '01-initial.sql');
  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  await queryInterface.sequelize.query(sql);

  await queryInterface.sequelize.transaction(async (transaction) => {
    await modifySearchConfig(queryInterface, transaction);
    await modifyCabinOpeningHoursKeyType(queryInterface, transaction);
    await modifyDocumentStatus(queryInterface, transaction);
    await modifyCabinPictureType(queryInterface, transaction);
    await modifyGrading(queryInterface, transaction);
    await modifyTripDirection(queryInterface, transaction);

    await modifySearchDocument(queryInterface, transaction);
    await modifyArea(queryInterface, transaction);
    await modifyGroup(queryInterface, transaction);
    await modifyCounty(queryInterface, transaction);
    await modifyMunicipality(queryInterface, transaction);
    await modifyCabin(queryInterface, transaction);
    await modifyCabinTranslation(queryInterface, transaction);
    await modifyPoi(queryInterface, transaction);
    await modifyPoiToPoiType(queryInterface, transaction);
    await modifyTrip(queryInterface, transaction);
    await modifyRoute(queryInterface, transaction);
    await modifyTagRelation(queryInterface, transaction);
    await modifyList(queryInterface, transaction);
    await modifyListType(queryInterface, transaction);
    await modifyListRelation(queryInterface, transaction);
  }).catch((err) => {
    logger.error('TRANSACTION ERROR');
    logger.error(err);
    down(db);
    throw err;
  });

  // Harvest counties and municipalities from kartverket
  // await harvestCountiesAndMunicipalities();

  logger.info('Done!');
};


module.exports = { up, down };

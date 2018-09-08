import { _ } from '@ntb/utils';


const uuidTables = [
  ['pictures', 'picture'],
  ['counties', 'county'],
  ['countyTranslations', 'countyTranslation'],
  ['municipalities', 'municipality'],
  ['municipalityTranslations', 'municipalityTranslation'],
  ['areas', 'area'],
  ['groups', 'group'],
  ['groupLinks', 'groupLink'],
  ['cabins', 'cabin'],
  ['cabinTranslations', 'cabinTranslation'],
  ['cabinLinks', 'cabinLink'],
  ['cabinOpeningHours', 'cabinOpeningHours'],
  ['lists', 'list'],
  ['listLinks', 'listLink'],
  ['pois', 'poi'],
  ['poiLinks', 'poiLink'],
  ['routes', 'route'],
  ['routeLinks', 'routeLink'],
  ['trips', 'trip'],
  ['tripLinks', 'tripLink'],
];


async function createSearchConfig(knex) {
  await knex.schema.createTable('searchConfig', (table) => {
    table.text('name')
      .primary();
    table.float('boost', 8, 2);
    table.specificType('weight', 'CHAR(1) DEFAULT NULL');
  });

  await knex('searchConfig')
    .insert([
      { name: 'search_document__area', boost: 1.1 },
      { name: 'search_document__group', boost: 1 },
      { name: 'search_document__cabin', boost: 1.5 },
      { name: 'search_document__poi', boost: 1.5 },
      { name: 'search_document__trip', boost: 1.5 },
      { name: 'search_document__route', boost: 1.5 },
      { name: 'search_document__county', boost: 1 },
      { name: 'search_document__municipality', boost: 1 },
      { name: 'search_document__list', boost: 1 },
      { name: 'area__field__name', weight: 'A' },
      { name: 'area__field__description', weight: 'D' },
      { name: 'cabin__field__name', weight: 'A' },
      { name: 'cabin__field__description', weight: 'D' },
      { name: 'poi__field__name', weight: 'A' },
      { name: 'poi__field__description', weight: 'D' },
      { name: 'trip__field__name', weight: 'A' },
      { name: 'trip__field__description', weight: 'D' },
      { name: 'route__field__name', weight: 'A' },
      { name: 'route__field__description', weight: 'C' },
      { name: 'route__field__description_direction', weight: 'D' },
      { name: 'group__field__name', weight: 'A' },
      { name: 'group__field__description', weight: 'D' },
      { name: 'list__field__name', weight: 'A' },
      { name: 'list__field__description', weight: 'D' },
      { name: 'county__field__name', weight: 'A' },
      { name: 'municipality__field__name', weight: 'A' },
    ]);
}


async function createSearchDocuments(knex) {
  await knex.schema.createTable('searchDocuments', (table) => {
    table.uuid('id')
      .primary();
    table.text('documentType')
      .notNullable();
    table.uuid('documentId')
      .notNullable();
    table.text('status')
      .notNullable()
      .references('name')
      .inTable('documentStatuses');
    table.float('searchDocumentBoost', 8, 2)
      .notNullable();
    table.float('searchDocumentTypeBoost', 8, 2)
      .notNullable();
    table.specificType('searchNb', 'TSVECTOR');
    table.specificType('searchEn', 'TSVECTOR');

    table.timestamps(true, true);

    table.unique(['documentType', 'documentId']);
    table.index('searchNb', null, 'gin');
    table.index('searchEn', null, 'gin');
  });
}


async function createDocumentStatuses(knex) {
  await knex.schema.createTable('documentStatuses', (table) => {
    table.text('name')
      .primary();
  });

  await knex('documentStatuses')
    .insert([
      { name: 'private' },
      { name: 'draft' },
      { name: 'deleted' },
      { name: 'public' },
    ]);
}


async function createCabinPictureTypes(knex) {
  await knex.schema.createTable('cabinPictureTypes', (table) => {
    table.text('name')
      .primary();
  });

  await knex('cabinPictureTypes')
    .insert([
      { name: 'summer' },
      { name: 'winter' },
      { name: 'interior' },
      { name: 'other' },
    ]);
}


async function createActivityTypes(knex) {
  await knex.schema.createTable('activityTypes', (table) => {
    table.text('name')
      .primary();
    table.boolean('primary')
      .notNullable()
      .defaultTo('false');
    table.text('description');
  });
}


async function createActivityTypesToActivityTypes(knex) {
  await knex.schema.createTable('activityTypesToActivityTypes', (table) => {
    table.text('primaryType')
      .notNullable()
      .references('name')
      .inTable('activityTypes');
    table.text('subType')
      .notNullable()
      .references('name')
      .inTable('activityTypes');

    table.primary(['primaryType', 'subType']);
  });
}


async function createGradings(knex) {
  await knex.schema.createTable('gradings', (table) => {
    table.text('name')
      .primary();
  });

  await knex('gradings')
    .insert([
      { name: 'easy' },
      { name: 'moderate' },
      { name: 'tough' },
      { name: 'very tough' },
    ]);
}


async function createPictures(knex) {
  await knex.schema.createTable('pictures', (table) => {
    table.uuid('id')
      .primary();
    table.text('idLegacyNtb')
      .unique();
    table.uuid('areaId');
    table.uuid('cabinId');
    table.uuid('listId');
    table.uuid('poiId');
    table.uuid('routeId');
    table.uuid('tripId');
    table.integer('sortIndex');
    table.text('cabinPictureType')
      .references('name')
      .inTable('cabinPictureTypes');
    table.text('photographerName');
    table.text('photographerEmail');
    table.text('photographerCredit');
    table.text('description');
    table.specificType('coordinates', 'GEOMETRY');
    table.jsonb('original');
    table.jsonb('exif');
    table.jsonb('versions');
    table.text('license');
    table.text('provider')
      .notNullable();
    table.text('legacyFirstTag');
    table.specificType('legacyTags', 'TEXT[]');
    table.text('status')
      .notNullable()
      .references('name')
      .inTable('documentStatuses');
    table.text('dataSource');

    table.timestamps(true, true);
  });
}


async function createCounties(knex) {
  await knex.schema.createTable('counties', (table) => {
    table.uuid('id')
      .primary();
    table.text('code')
      .notNullable();
    table.text('name')
      .notNullable();
    table.text('nameLowerCase')
      .notNullable();
    table.text('status')
      .notNullable()
      .references('name')
      .inTable('documentStatuses');
    table.text('dataSource');

    table.timestamps(true, true);
  });
}


async function createCountyTranslations(knex) {
  await knex.schema.createTable('countyTranslations', (table) => {
    table.uuid('id')
      .primary();
    table.uuid('countyId')
      .notNullable()
      .references('id')
      .inTable('counties');
    table.text('name')
      .notNullable();
    table.text('nameLowerCase')
      .notNullable();
    table.text('language')
      .notNullable();
    table.text('dataSource');

    table.timestamps(true, true);

    table.unique(['countyId', 'language']);
  });
}


async function createMunicipalities(knex) {
  await knex.schema.createTable('municipalities', (table) => {
    table.uuid('id')
      .primary();
    table.text('code')
      .notNullable();
    table.text('name')
      .notNullable();
    table.text('nameLowerCase')
      .notNullable();
    table.text('status')
      .notNullable()
      .references('name')
      .inTable('documentStatuses');
    table.text('dataSource');

    table.timestamps(true, true);
  });
}


async function createMunicipalityTranslations(knex) {
  await knex.schema.createTable('municipalityTranslations', (table) => {
    table.uuid('id')
      .primary();
    table.uuid('municipalityId')
      .notNullable()
      .references('id')
      .inTable('municipalities');
    table.text('name')
      .notNullable();
    table.text('nameLowerCase')
      .notNullable();
    table.text('language')
      .notNullable();
    table.text('dataSource');

    table.timestamps(true, true);

    table.unique(['municipalityId', 'language']);
  });
}


async function createAreas(knex) {
  await knex.schema.createTable('areas', (table) => {
    table.uuid('id')
      .primary();
    table.text('idLegacyNtb')
      .unique();
    table.text('name')
      .notNullable();
    table.text('nameLowerCase')
      .notNullable();
    table.text('description');
    table.text('descriptionPlain');
    table.specificType('geometry', 'GEOMETRY');
    table.text('map');
    table.text('url');
    table.text('license');
    table.text('provider')
      .notNullable();
    table.text('status')
      .notNullable()
      .references('name')
      .inTable('documentStatuses');
    table.text('dataSource');
    table.float('searchDocumentBoost', 8, 2);
    table.specificType('searchNb', 'TSVECTOR');

    table.timestamps(true, true);

    table.index('searchNb', null, 'gin');
  });

  // Create name_lower_case trigger procedure for 'areas'-table
  await knex.schema.raw([
    'CREATE FUNCTION areas_name_lower_case_trigger() RETURNS trigger AS $$',
    'BEGIN',
    '  NEW.name_lower_case := lower(NEW.name);',
    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'));

  // Create tsvector trigger procedure for 'areas'-table
  await knex.schema.raw([
    'CREATE FUNCTION areas_tsvector_trigger() RETURNS trigger AS $$',
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
  ].join('\n'));

  // Create search document trigger procedure for 'areas'-table
  await knex.schema.raw([
    'CREATE FUNCTION areas_search_document_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  boost FLOAT;',
    'BEGIN',

    '  SELECT sbc.boost INTO boost',
    '  FROM search_config AS sbc',
    '  WHERE sbc.name = \'search_document__area\';',

    '  INSERT INTO search_documents (',
    '    id, document_type, document_id, status, search_nb,',
    '    search_document_boost, search_document_type_boost, created_at,',
    '    updated_at',
    '  )',
    '  VALUES (',
    '    uuid_generate_v4(), \'area\', NEW.id, NEW.status, NEW.search_nb,',
    '    NEW.search_document_boost, boost, NEW.created_at, NEW.updated_at',
    '  )',
    '  ON CONFLICT ("document_type", "document_id")',
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

  // Use name_lower_case trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER areas_name_lower_case_update BEFORE INSERT OR UPDATE',
    'ON "areas"',
    'FOR EACH ROW EXECUTE PROCEDURE areas_name_lower_case_trigger();',
  ].join('\n'));

  // Use tsvector trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER areas_tsvector_update BEFORE INSERT OR UPDATE',
    'ON "areas"',
    'FOR EACH ROW EXECUTE PROCEDURE areas_tsvector_trigger();',
  ].join('\n'));

  // Use tsvector trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER areas_search_document_update AFTER INSERT OR UPDATE',
    'ON "areas"',
    'FOR EACH ROW EXECUTE PROCEDURE areas_search_document_trigger();',
  ].join('\n'));
}


async function createAreasToAreas(knex) {
  await knex.schema.createTable('areasToAreas', (table) => {
    table.uuid('parentId')
      .notNullable()
      .references('id')
      .inTable('areas');
    table.uuid('childId')
      .notNullable()
      .references('id')
      .inTable('areas');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['parentId', 'childId']);
  });
}


async function createAreasToCounties(knex) {
  await knex.schema.createTable('areasToCounties', (table) => {
    table.uuid('areaId')
      .notNullable()
      .references('id')
      .inTable('areas');
    table.uuid('countyId')
      .notNullable()
      .references('id')
      .inTable('counties');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['areaId', 'countyId']);
  });
}


async function createAreasToMunicipalities(knex) {
  await knex.schema.createTable('areasToMunicipalities', (table) => {
    table.uuid('areaId')
      .notNullable()
      .references('id')
      .inTable('areas');
    table.uuid('municipalityId')
      .notNullable()
      .references('id')
      .inTable('municipalities');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['areaId', 'municipalityId']);
  });
}


async function createGroupTypes(knex) {
  await knex.schema.createTable('groupTypes', (table) => {
    table.text('name')
      .primary();
    table.text('parent')
      .references('name')
      .inTable('groupTypes');
    table.text('description');
  });
}


async function createGroups(knex) {
  await knex.schema.createTable('groups', (table) => {
    table.uuid('id')
      .primary();
    table.text('idLegacyNtb')
      .unique();
    table.text('groupType')
      .notNullable()
      .references('name')
      .inTable('groupTypes');
    table.text('groupSubType')
      .references('name')
      .inTable('groupTypes');
    table.uuid('municipalityId')
      .references('id')
      .inTable('municipalities');
    table.text('name')
      .notNullable();
    table.text('nameLowerCase')
      .notNullable();
    table.text('description');
    table.text('descriptionPlain');
    table.text('logo');
    table.text('organizationNumber');
    table.text('url');
    table.text('email');
    table.text('phone');
    table.text('mobile');
    table.text('fax');
    table.text('address1');
    table.text('address2');
    table.text('postalCode');
    table.text('postalName');
    table.text('license');
    table.text('provider')
      .notNullable();
    table.text('status')
      .notNullable()
      .references('name')
      .inTable('documentStatuses');
    table.text('dataSource');
    table.float('searchDocumentBoost', 8, 2);
    table.specificType('searchNb', 'TSVECTOR');

    table.timestamps(true, true);

    table.index('searchNb', null, 'gin');
  });

  // Create name_lower_case trigger procedure for 'groups'-table
  await knex.schema.raw([
    'CREATE FUNCTION groups_name_lower_case_trigger() RETURNS trigger AS $$',
    'BEGIN',
    '  NEW.name_lower_case := lower(NEW.name);',
    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'));

  // // Create tsvector trigger procedure for 'groups'-table
  await knex.schema.raw([
    'CREATE FUNCTION groups_tsvector_trigger() RETURNS trigger AS $$',
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
  ].join('\n'));

  // // Create search document trigger procedure for 'areas'-table
  await knex.schema.raw([
    'CREATE FUNCTION groups_search_document_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  boost FLOAT;',
    'BEGIN',

    '  SELECT sbc.boost INTO boost',
    '  FROM search_config AS sbc',
    '  WHERE sbc.name = \'search_document__group\';',

    '  INSERT INTO search_documents (',
    '    id, document_type, document_id, status, search_nb,',
    '    search_document_boost, search_document_type_boost,',
    '    created_at, updated_at',
    '  )',
    '  VALUES (',
    '    uuid_generate_v4(), \'group\', NEW.id, NEW.status, NEW.search_nb,',
    '    NEW.search_document_boost, boost, NEW.created_at, NEW.updated_at',
    '  )',
    '  ON CONFLICT ("document_type", "document_id")',
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

  // // Use name_lower_case trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER groups_name_lower_case_update BEFORE INSERT OR UPDATE',
    'ON "groups"',
    'FOR EACH ROW EXECUTE PROCEDURE groups_name_lower_case_trigger();',
  ].join('\n'));

  // // Use tsvector trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER groups_tsvector_update BEFORE INSERT OR UPDATE',
    'ON "groups"',
    'FOR EACH ROW EXECUTE PROCEDURE groups_tsvector_trigger();',
  ].join('\n'));

  // // Use tsvector trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER groups_search_document_update AFTER INSERT OR UPDATE',
    'ON "groups"',
    'FOR EACH ROW EXECUTE PROCEDURE groups_search_document_trigger();',
  ].join('\n'));
}


async function createGroupLinks(knex) {
  await knex.schema.createTable('groupLinks', (table) => {
    table.uuid('id')
      .primary();
    table.uuid('groupId')
      .notNullable()
      .references('id')
      .inTable('groups');
    table.text('type')
      .notNullable();
    table.text('title');
    table.text('url')
      .notNullable();
    table.integer('sortIndex');
    table.text('dataSource');

    table.timestamps(true, true);

    table.unique(['groupId', 'sortIndex']);
  });
}


async function createAccessabilities(knex) {
  await knex.schema.createTable('accessabilities', (table) => {
    table.text('name')
      .primary();
    table.text('description');
  });
}


async function createFacilities(knex) {
  await knex.schema.createTable('facilities', (table) => {
    table.text('name')
      .primary();
    table.text('description');
  });
}


async function createCabinServiceLevels(knex) {
  await knex.schema.createTable('cabinServiceLevels', (table) => {
    table.text('name')
      .primary();
    table.text('description');
  });
}


async function createCabins(knex) {
  await knex.schema.createTable('cabins', (table) => {
    table.uuid('id')
      .primary();
    table.text('idLegacyNtb')
      .unique();
    table.text('idSsr');
    table.boolean('dntCabin')
      .notNullable()
      .defaultTo('false');
    table.boolean('dntDiscount')
      .notNullable()
      .defaultTo('false');
    table.uuid('maintainerGroupId')
      .references('id')
      .inTable('groups');
    table.uuid('ownerGroupId')
      .references('id')
      .inTable('groups');
    table.uuid('contactGroupId')
      .references('id')
      .inTable('groups');
    table.text('name')
      .notNullable();
    table.text('nameLowerCase')
      .notNullable();
    table.specificType('nameAlt', 'TEXT[]');
    table.specificType('nameAltLowerCase', 'TEXT[]');
    table.text('description');
    table.text('descriptionPlain');
    table.text('contactName');
    table.text('email');
    table.text('phone');
    table.text('mobile');
    table.text('fax');
    table.text('address1');
    table.text('address2');
    table.text('postalCode');
    table.text('postalName');
    table.text('url');
    table.integer('yearOfConstruction');
    table.specificType('coordinates', 'GEOMETRY');
    table.uuid('countyId')
      .references('id')
      .inTable('counties');
    table.uuid('municipalityId')
      .references('id')
      .inTable('municipalities');
    table.text('serviceLevel')
      .references('name')
      .inTable('cabinServiceLevels');
    table.integer('bedsExtra')
      .notNullable()
      .defaultTo(0);
    table.integer('bedsStaffed')
      .notNullable()
      .defaultTo(0);
    table.integer('bedsSelfService')
      .notNullable()
      .defaultTo(0);
    table.integer('bedsNoService')
      .notNullable()
      .defaultTo(0);
    table.integer('bedsWinter')
      .notNullable()
      .defaultTo(0);
    table.boolean('bookingEnabled')
      .notNullable()
      .defaultTo('false');
    table.boolean('bookingOnly')
      .notNullable()
      .defaultTo('false');
    table.text('bookingUrl');
    table.text('htgtGeneral');
    table.text('htgtWinter');
    table.text('htgtSummer');
    table.text('htgtPublicTransport');
    table.boolean('htgtCarAllYear');
    table.boolean('htgtCarSummer');
    table.boolean('htgtBicycle');
    table.boolean('htgtPublicTransportAvailable');
    table.boolean('htgtBoatTransportAvailable');
    table.text('map');
    table.specificType('mapAlt', 'TEXT[]');
    table.text('license');
    table.text('provider')
      .notNullable();
    table.text('status')
      .notNullable()
      .references('name')
      .inTable('documentStatuses');
    table.text('dataSource');
    table.float('searchDocumentBoost', 8, 2);
    table.specificType('searchNb', 'TSVECTOR');
    table.specificType('searchEn', 'TSVECTOR');

    table.timestamps(true, true);

    table.index('searchNb', null, 'gin');
    table.index('searchEn', null, 'gin');
  });

  // Create name_lower_case trigger procedure for 'cabins'-table
  await knex.schema.raw([
    'CREATE FUNCTION cabins_name_lower_case_trigger() RETURNS trigger AS $$',
    'BEGIN',
    '  NEW.name_lower_case := lower(NEW.name);',
    '  NEW.name_alt_lower_case := ARRAY(',
    '    SELECT LOWER(s) FROM UNNEST(NEW.name_alt) s',
    '  );',
    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'));

  // // Create tsvector trigger procedure for 'cabins'-table
  await knex.schema.raw([
    'CREATE FUNCTION cabins_tsvector_trigger() RETURNS trigger AS $$',
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
  ].join('\n'));

  // // Create search document trigger procedure for 'cabins'-table
  await knex.schema.raw([
    'CREATE FUNCTION cabins_search_document_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  boost FLOAT;',
    'BEGIN',

    '  SELECT sbc.boost INTO boost',
    '  FROM search_config AS sbc',
    '  WHERE sbc.name = \'search_document__cabin\';',

    '  INSERT INTO search_documents (',
    '    id, document_type, document_id, status, search_nb,',
    '    search_document_boost, search_document_type_boost,',
    '    created_at, updated_at',
    '  )',
    '  VALUES (',
    '    uuid_generate_v4(), \'cabin\', NEW.id, NEW.status, NEW.search_nb,',
    '    NEW.search_document_boost, boost, NEW.created_at, NEW.updated_at',
    '  )',
    '  ON CONFLICT ("document_type", "document_id")',
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

  // // Use name_lower_case trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER cabins_name_lower_case_update BEFORE INSERT OR UPDATE',
    'ON "cabins"',
    'FOR EACH ROW EXECUTE PROCEDURE cabins_name_lower_case_trigger();',
  ].join('\n'));

  // // Use tsvector trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER cabins_tsvector_update BEFORE INSERT OR UPDATE',
    'ON "cabins"',
    'FOR EACH ROW EXECUTE PROCEDURE cabins_tsvector_trigger();',
  ].join('\n'));

  // // Use tsvector trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER cabins_search_document_update AFTER INSERT OR UPDATE',
    'ON "cabins"',
    'FOR EACH ROW EXECUTE PROCEDURE cabins_search_document_trigger();',
  ].join('\n'));
}


async function createCabinTranslations(knex) {
  await knex.schema.createTable('cabinTranslations', (table) => {
    table.uuid('id')
      .primary();
    table.uuid('cabinId')
      .notNullable()
      .references('id')
      .inTable('cabins');
    table.text('name')
      .notNullable();
    table.text('nameLowerCase')
      .notNullable();
    table.text('description');
    table.text('descriptionPlain');
    table.text('language')
      .notNullable();
    table.text('dataSource');

    table.timestamps();

    table.unique(['cabinId', 'language']);
  });

  // Update search document and cabin trigger procedure for update
  await knex.schema.raw([
    'CREATE FUNCTION cabin_translations_on_insert_or_update()',
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

    '    UPDATE "search_documents" SET',
    '      "search_en" = vector',
    '    WHERE',
    '      "document_id" = NEW.cabin_id',
    '      AND "document_type" = \'cabin\';',

    '    UPDATE "cabins" SET',
    '      "search_en" = vector',
    '    WHERE',
    '      "id" = NEW.cabin_id;',
    '  END IF;',

    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'));

  // Update search document and cabin trigger procedure for delete
  await knex.schema.raw([
    'CREATE FUNCTION cabin_translations_on_delete()',
    'RETURNS trigger AS $$',
    'BEGIN',

    '  IF OLD.language = \'en\' THEN',
    '    UPDATE "search_document" SET',
    '      "search_en" = NULL',
    '    WHERE',
    '      "document_id" = OLD.cabin_id',
    '      AND "document_type" = \'cabin\';',

    '    UPDATE "cabins" SET',
    '      "search_en" = NULL',
    '    WHERE',
    '      "id" = OLD.cabin_id;',
    '  END IF;',

    '  RETURN OLD;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'));

  // Use tsvector trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER cabin_translations_update_trigger',
    'AFTER INSERT OR UPDATE ON "cabin_translations"',
    'FOR EACH ROW EXECUTE PROCEDURE',
    'cabin_translations_on_insert_or_update();',
  ].join('\n'));

  // Use tsvector trigger before each delete
  await knex.schema.raw([
    'CREATE TRIGGER cabin_translations_delete_trigger',
    'BEFORE DELETE ON "cabin_translations"',
    'FOR EACH ROW EXECUTE PROCEDURE',
    'cabin_translations_on_delete();',
  ].join('\n'));
}


async function createCabinLinks(knex) {
  await knex.schema.createTable('cabinLinks', (table) => {
    table.uuid('id')
      .primary();
    table.uuid('cabinId')
      .notNullable()
      .references('id')
      .inTable('cabins');
    table.text('type')
      .notNullable();
    table.text('title');
    table.text('url')
      .notNullable();
    table.integer('sortIndex');
    table.text('dataSource');

    table.timestamps(true, true);

    table.unique(['cabinId', 'sortIndex']);
  });
}


async function createCabinAccessabilities(knex) {
  await knex.schema.createTable('cabinAccessabilities', (table) => {
    table.text('accessabilityName')
      .notNullable()
      .references('name')
      .inTable('accessabilities');
    table.uuid('cabinId')
      .notNullable()
      .references('id')
      .inTable('cabins');
    table.text('description');
    table.text('dataSource');

    table.primary(['accessabilityName', 'cabinId']);
  });
}


async function createCabinFacilities(knex) {
  await knex.schema.createTable('cabinFacilities', (table) => {
    table.text('facilityName')
      .notNullable()
      .references('name')
      .inTable('facilities');
    table.uuid('cabinId')
      .notNullable()
      .references('id')
      .inTable('cabins');
    table.text('description');
    table.text('dataSource');

    table.primary(['facilityName', 'cabinId']);
  });
}


async function createCabinOpeningHoursKeyTypes(knex) {
  await knex.schema.createTable('cabinOpeningHoursKeyTypes', (table) => {
    table.text('name')
      .primary();
  });

  await knex('cabinOpeningHoursKeyTypes')
    .insert([
      { name: 'unlocked' },
      { name: 'dnt-key' },
      { name: 'special key' },
    ]);
}


async function createCabinOpeningHours(knex) {
  await knex.schema.createTable('cabinOpeningHours', (table) => {
    table.uuid('id')
      .primary();
    table.uuid('cabinId')
      .notNullable()
      .references('id')
      .inTable('cabins');
    table.boolean('allYear')
      .notNullable()
      .defaultTo('false');
    table.timestamp('from');
    table.timestamp('to');
    table.text('serviceLevel')
      .references('name')
      .inTable('cabinServiceLevels');
    table.text('key')
      .references('name')
      .inTable('cabinOpeningHoursKeyTypes');
    table.integer('sortIndex');
    table.text('dataSource');

    table.timestamps(true, true);

    table.unique(['cabinId', 'sortIndex']);
  });
}


async function createCabinsToAreas(knex) {
  await knex.schema.createTable('cabinsToAreas', (table) => {
    table.uuid('cabinId')
      .notNullable()
      .references('id')
      .inTable('cabins');
    table.uuid('areaId')
      .notNullable()
      .references('id')
      .inTable('areas');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['cabinId', 'areaId']);
  });
}


async function createListTypes(knex) {
  await knex.schema.createTable('listTypes', (table) => {
    table.text('name')
      .primary();
    table.text('description');
  });

  await knex('listTypes')
    .insert({ name: 'sjekkut' });
}


async function createLists(knex) {
  await knex.schema.createTable('lists', (table) => {
    table.uuid('id')
      .primary();
    table.text('idLegacyNtb')
      .unique();
    table.text('listType')
      .notNullable()
      .references('name')
      .inTable('listTypes');
    table.text('name')
      .notNullable();
    table.text('nameLowerCase')
      .notNullable();
    table.text('description');
    table.text('descriptionPlain');
    table.specificType('coordinates', 'GEOMETRY');
    table.timestamp('startDate');
    table.timestamp('endDate');
    table.text('license');
    table.text('provider')
      .notNullable();
    table.text('status')
      .notNullable()
      .references('name')
      .inTable('documentStatuses');
    table.text('dataSource');
    table.float('searchDocumentBoost', 8, 2);
    table.specificType('searchNb', 'TSVECTOR');
    table.specificType('searchEn', 'TSVECTOR');

    table.timestamps(true, true);

    table.index('searchNb', null, 'gin');
  });

  // Create name_lower_case trigger procedure for 'lists'-table
  await knex.schema.raw([
    'CREATE FUNCTION lists_name_lower_case_trigger() RETURNS trigger AS $$',
    'BEGIN',
    '  NEW.name_lower_case := lower(NEW.name);',
    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'));

  // // Create tsvector trigger procedure for 'lists'-table
  await knex.schema.raw([
    'CREATE FUNCTION lists_tsvector_trigger() RETURNS trigger AS $$',
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
  ].join('\n'));

  // // Create search document trigger procedure for 'lists'-table
  await knex.schema.raw([
    'CREATE FUNCTION lists_search_document_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  boost FLOAT;',
    'BEGIN',

    '  SELECT sbc.boost INTO boost',
    '  FROM search_config AS sbc',
    '  WHERE sbc.name = \'search_document__list\';',

    '  INSERT INTO search_documents (',
    '    id, document_type, document_id, status, search_nb,',
    '    search_document_boost, search_document_type_boost,',
    '    created_at, updated_at',
    '  )',
    '  VALUES (',
    '    uuid_generate_v4(), \'list\', NEW.id, NEW.status, NEW.search_nb,',
    '    NEW.search_document_boost, boost, NEW.created_at, NEW.updated_at',
    '  )',
    '  ON CONFLICT ("document_type", "document_id")',
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

  // // Use name_lower_case trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER lists_name_lower_case_update BEFORE INSERT OR UPDATE',
    'ON "lists"',
    'FOR EACH ROW EXECUTE PROCEDURE lists_name_lower_case_trigger();',
  ].join('\n'));

  // // Use tsvector trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER lists_tsvector_update BEFORE INSERT OR UPDATE',
    'ON "lists"',
    'FOR EACH ROW EXECUTE PROCEDURE lists_tsvector_trigger();',
  ].join('\n'));

  // // Use tsvector trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER lists_search_document_update AFTER INSERT OR UPDATE',
    'ON "lists"',
    'FOR EACH ROW EXECUTE PROCEDURE lists_search_document_trigger();',
  ].join('\n'));
}


async function createListLinks(knex) {
  await knex.schema.createTable('listLinks', (table) => {
    table.uuid('id')
      .primary();
    table.uuid('listId')
      .notNullable()
      .references('id')
      .inTable('lists');
    table.text('type')
      .notNullable();
    table.text('title');
    table.text('url')
      .notNullable();
    table.integer('sortIndex');
    table.text('dataSource');

    table.timestamps(true, true);

    table.unique(['listId', 'sortIndex']);
  });
}


async function createListRelations(knex) {
  await knex.schema.createTable('listRelations', (table) => {
    table.uuid('listId')
      .notNullable()
      .references('id')
      .inTable('lists');
    table.text('documentType')
      .notNullable();
    table.uuid('documentId')
      .notNullable();
    table.integer('sortIndex');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['listId', 'documentType', 'documentId']);
  });
}


async function createListsToCounties(knex) {
  await knex.schema.createTable('listsToCounties', (table) => {
    table.uuid('listId')
      .notNullable()
      .references('id')
      .inTable('lists');
    table.uuid('countyId')
      .notNullable()
      .references('id')
      .inTable('counties');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['listId', 'countyId']);
  });
}


async function createListsToMunicipalities(knex) {
  await knex.schema.createTable('listsToMunicipalities', (table) => {
    table.uuid('listId')
      .notNullable()
      .references('id')
      .inTable('lists');
    table.uuid('municipalityId')
      .notNullable()
      .references('id')
      .inTable('municipalities');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['listId', 'municipalityId']);
  });
}


async function createListsToGroups(knex) {
  await knex.schema.createTable('listsToGroups', (table) => {
    table.uuid('listId')
      .notNullable()
      .references('id')
      .inTable('lists');
    table.uuid('groupId')
      .notNullable()
      .references('id')
      .inTable('groups');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['listId', 'groupId']);
  });
}


async function createPoiTypes(knex) {
  await knex.schema.createTable('poiTypes', (table) => {
    table.text('name')
      .primary();
    table.text('description');
  });
}


async function createPois(knex) {
  await knex.schema.createTable('pois', (table) => {
    table.uuid('id')
      .primary();
    table.text('idLegacyNtb')
      .unique();
    table.text('idSsr');
    table.text('type')
      .notNullable()
      .references('name')
      .inTable('poiTypes');
    table.text('name')
      .notNullable();
    table.text('nameLowerCase')
      .notNullable();
    table.text('description');
    table.text('descriptionPlain');
    table.specificType('coordinates', 'GEOMETRY');
    table.specificType('season', 'INTEGER[]');
    table.boolean('open');
    table.uuid('countyId')
      .references('id')
      .inTable('counties');
    table.uuid('municipalityId')
      .references('id')
      .inTable('municipalities');
    table.text('license');
    table.text('provider')
      .notNullable();
    table.text('status')
      .notNullable()
      .references('name')
      .inTable('documentStatuses');
    table.text('dataSource');
    table.float('searchDocumentBoost', 8, 2);
    table.specificType('searchNb', 'TSVECTOR');
    table.specificType('searchEn', 'TSVECTOR');

    table.timestamps(true, true);

    table.index('searchNb', null, 'gin');
  });

  // Create name_lower_case trigger procedure for 'pois'-table
  await knex.schema.raw([
    'CREATE FUNCTION pois_name_lower_case_trigger() RETURNS trigger AS $$',
    'BEGIN',
    '  NEW.name_lower_case := lower(NEW.name);',
    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'));

  // // Create tsvector trigger procedure for 'pois'-table
  await knex.schema.raw([
    'CREATE FUNCTION pois_tsvector_trigger() RETURNS trigger AS $$',
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
  ].join('\n'));

  // // Create search document trigger procedure for 'pois'-table
  await knex.schema.raw([
    'CREATE FUNCTION pois_search_document_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  boost FLOAT;',
    'BEGIN',

    '  SELECT sbc.boost INTO boost',
    '  FROM search_config AS sbc',
    '  WHERE sbc.name = \'search_document__poi\';',

    '  INSERT INTO search_documents (',
    '    id, document_type, document_id, status, search_nb,',
    '    search_document_boost, search_document_type_boost,',
    '    created_at, updated_at',
    '  )',
    '  VALUES (',
    '    uuid_generate_v4(), \'poi\', NEW.id, NEW.status, NEW.search_nb,',
    '    NEW.search_document_boost, boost, NEW.created_at, NEW.updated_at',
    '  )',
    '  ON CONFLICT ("document_type", "document_id")',
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

  // // Use name_lower_case trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER pois_name_lower_case_update BEFORE INSERT OR UPDATE',
    'ON "pois"',
    'FOR EACH ROW EXECUTE PROCEDURE pois_name_lower_case_trigger();',
  ].join('\n'));

  // // Use tsvector trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER pois_tsvector_update BEFORE INSERT OR UPDATE',
    'ON "pois"',
    'FOR EACH ROW EXECUTE PROCEDURE pois_tsvector_trigger();',
  ].join('\n'));

  // // Use tsvector trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER pois_search_document_update AFTER INSERT OR UPDATE',
    'ON "pois"',
    'FOR EACH ROW EXECUTE PROCEDURE pois_search_document_trigger();',
  ].join('\n'));
}


async function createPoiAccessabilities(knex) {
  await knex.schema.createTable('poiAccessabilities', (table) => {
    table.text('accessabilityName')
      .notNullable()
      .references('name')
      .inTable('accessabilities');
    table.uuid('poiId')
      .notNullable()
      .references('id')
      .inTable('pois');
    table.text('description');
    table.text('dataSource');

    table.primary(['accessabilityName', 'poiId']);
  });
}


async function createPoiLinks(knex) {
  await knex.schema.createTable('poiLinks', (table) => {
    table.uuid('id')
      .primary();
    table.uuid('poiId')
      .notNullable()
      .references('id')
      .inTable('pois');
    table.text('type');
    table.text('title');
    table.text('url')
      .notNullable();
    table.integer('sortIndex');
    table.text('dataSource');

    table.timestamps(true, true);

    table.unique(['poiId', 'sortIndex']);
  });
}


async function createPoisToPoiTypes(knex) {
  await knex.schema.createTable('poisToPoiTypes', (table) => {
    table.text('poiType')
      .notNullable()
      .references('name')
      .inTable('poiTypes');
    table.uuid('poiId')
      .notNullable()
      .references('id')
      .inTable('pois');
    table.boolean('primary')
      .notNullable();
    table.integer('sortIndex')
      .notNullable();
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['poiType', 'poiId']);
    table.unique(['poiId', 'sortIndex']);
  });
}


async function createPoisToAreas(knex) {
  await knex.schema.createTable('poisToAreas', (table) => {
    table.uuid('poiId')
      .notNullable()
      .references('id')
      .inTable('pois');
    table.uuid('areaId')
      .notNullable()
      .references('id')
      .inTable('areas');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['poiId', 'areaId']);
  });
}


async function createPoisToGroups(knex) {
  await knex.schema.createTable('poisToGroups', (table) => {
    table.uuid('poiId')
      .notNullable()
      .references('id')
      .inTable('pois');
    table.uuid('groupId')
      .notNullable()
      .references('id')
      .inTable('groups');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['poiId', 'groupId']);
  });
}


async function createRoutes(knex) {
  await knex.schema.createTable('routes', (table) => {
    table.uuid('id')
      .primary();
    table.text('idLegacyNtbAb')
      .unique();
    table.text('idLegacyNtbBa')
      .unique();
    table.text('code')
      .notNullable()
      .unique();
    table.boolean('isWinter')
      .notNullable()
      .defaultTo('false');
    table.text('name')
      .notNullable();
    table.text('nameLowerCase')
      .notNullable();
    table.text('description');
    table.text('descriptionPlain');
    table.text('descriptionAb');
    table.text('descriptionAbPlain');
    table.text('descriptionBa');
    table.text('descriptionBaPlain');
    table.text('url');
    table.text('source');
    table.text('notes');
    table.text('grading')
      .references('name')
      .inTable('gradings');
    table.boolean('suitableForChildren')
      .notNullable()
      .defaultTo('false');
    table.integer('distance');
    table.boolean('waymarkWinterAllYear')
      .notNullable()
      .defaultTo('false');
    table.timestamp('waymarkWinterFrom');
    table.timestamp('waymarkWinterTo');
    table.text('waymarkWinterComment');
    table.integer('durationMinutes');
    table.integer('durationHours');
    table.integer('durationDays');
    table.specificType('pointA', 'GEOMETRY');
    table.specificType('pointB', 'GEOMETRY');
    table.specificType('pathAb', 'GEOMETRY');
    table.specificType('pathBa', 'GEOMETRY');
    table.text('pathAbPolyline');
    table.text('pathBaPolyline');
    table.specificType('season', 'INTEGER[]');
    table.text('license');
    table.text('provider')
      .notNullable();
    table.text('status')
      .notNullable()
      .references('name')
      .inTable('documentStatuses');
    table.text('dataSource');
    table.float('searchDocumentBoost', 8, 2);
    table.specificType('searchNb', 'TSVECTOR');
    table.specificType('searchEn', 'TSVECTOR');

    table.timestamps(true, true);

    table.index('searchNb', null, 'gin');
  });

  // Create name_lower_case trigger procedure for 'routes'-table
  await knex.schema.raw([
    'CREATE FUNCTION routes_name_lower_case_trigger() RETURNS trigger AS $$',
    'BEGIN',
    '  NEW.name_lower_case := lower(NEW.name);',
    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'));

  // // Create tsvector trigger procedure for 'routes'-table
  await knex.schema.raw([
    'CREATE FUNCTION routes_tsvector_trigger() RETURNS trigger AS $$',
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
  ].join('\n'));

  // // Create search document trigger procedure for 'routes'-table
  await knex.schema.raw([
    'CREATE FUNCTION routes_search_document_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  boost FLOAT;',
    'BEGIN',

    '  SELECT sbc.boost INTO boost',
    '  FROM search_config AS sbc',
    '  WHERE sbc.name = \'search_document__route\';',

    '  INSERT INTO search_documents (',
    '    id, document_type, document_id, status, search_nb,',
    '    search_document_boost, search_document_type_boost,',
    '    created_at, updated_at',
    '  )',
    '  VALUES (',
    '    uuid_generate_v4(), \'route\', NEW.id, NEW.status, NEW.search_nb,',
    '    NEW.search_document_boost, boost, NEW.created_at, NEW.updated_at',
    '  )',
    '  ON CONFLICT ("document_type", "document_id")',
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

  // // Use name_lower_case trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER routes_name_lower_case_update BEFORE INSERT OR UPDATE',
    'ON "routes"',
    'FOR EACH ROW EXECUTE PROCEDURE routes_name_lower_case_trigger();',
  ].join('\n'));

  // // Use tsvector trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER routes_tsvector_update BEFORE INSERT OR UPDATE',
    'ON "routes"',
    'FOR EACH ROW EXECUTE PROCEDURE routes_tsvector_trigger();',
  ].join('\n'));

  // // Use tsvector trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER routes_search_document_update AFTER INSERT OR UPDATE',
    'ON "routes"',
    'FOR EACH ROW EXECUTE PROCEDURE routes_search_document_trigger();',
  ].join('\n'));
}


async function createRouteLinks(knex) {
  await knex.schema.createTable('routeLinks', (table) => {
    table.uuid('id')
      .primary();
    table.uuid('routeId')
      .notNullable()
      .references('id')
      .inTable('routes');
    table.text('type');
    table.text('title');
    table.text('url')
      .notNullable();
    table.integer('sortIndex');
    table.text('dataSource');

    table.timestamps(true, true);

    table.unique(['routeId', 'sortIndex']);
  });
}


async function createRoutesToActivityTypes(knex) {
  await knex.schema.createTable('routesToActivityTypes', (table) => {
    table.uuid('routeId')
      .notNullable()
      .references('id')
      .inTable('routes');
    table.text('activityTypeName')
      .notNullable()
      .references('name')
      .inTable('activityTypes');
    table.integer('sortIndex');
    table.text('dataSource');

    table.primary(['routeId', 'activityTypeName']);
  });
}


async function createRoutesToCounties(knex) {
  await knex.schema.createTable('routesToCounties', (table) => {
    table.uuid('routeId')
      .notNullable()
      .references('id')
      .inTable('routes');
    table.uuid('countyId')
      .notNullable()
      .references('id')
      .inTable('counties');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['routeId', 'countyId']);
  });
}


async function createRoutesToGroups(knex) {
  await knex.schema.createTable('routesToGroups', (table) => {
    table.uuid('routeId')
      .notNullable()
      .references('id')
      .inTable('routes');
    table.uuid('groupId')
      .notNullable()
      .references('id')
      .inTable('groups');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['routeId', 'groupId']);
  });
}


async function createRoutesToPois(knex) {
  await knex.schema.createTable('routesToPois', (table) => {
    table.uuid('routeId')
      .notNullable()
      .references('id')
      .inTable('routes');
    table.uuid('poiId')
      .notNullable()
      .references('id')
      .inTable('pois');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['routeId', 'poiId']);
  });
}


async function createRouteWaymarkTypes(knex) {
  await knex.schema.createTable('routeWaymarkTypes', (table) => {
    table.text('name')
      .primary();
    table.text('description');
  });
}


async function createRoutesToRouteWaymarkTypes(knex) {
  await knex.schema.createTable('routesToRouteWaymarkTypes', (table) => {
    table.uuid('routeId')
      .notNullable()
      .references('id')
      .inTable('routes');
    table.text('routeWaymarkTypeName')
      .notNullable()
      .references('name')
      .inTable('routeWaymarkTypes');
    table.text('dataSource');

    table.primary(['routeId', 'routeWaymarkTypeName']);
  });
}


async function createTripDirections(knex) {
  await knex.schema.createTable('tripDirections', (table) => {
    table.text('name')
      .primary();
  });

  await knex('tripDirections')
    .insert([
      { name: 'ab' },
      { name: 'aba' },
    ]);
}


async function createTrips(knex) {
  await knex.schema.createTable('trips', (table) => {
    table.uuid('id')
      .primary();
    table.text('idLegacyNtb')
      .unique();
    table.text('activityType')
      .references('name')
      .inTable('activityTypes');
    table.text('name')
      .notNullable();
    table.text('nameLowerCase')
      .notNullable();
    table.text('description');
    table.text('descriptionPlain');
    table.text('url');
    table.text('grading')
      .references('name')
      .inTable('gradings');
    table.boolean('suitableForChildren')
      .notNullable()
      .defaultTo('false');
    table.integer('distance');
    table.text('direction')
      .references('name')
      .inTable('tripDirections');
    table.integer('durationMinutes');
    table.integer('durationHours');
    table.integer('durationDays');
    table.specificType('startingPoint', 'GEOMETRY');
    table.specificType('path', 'GEOMETRY');
    table.text('pathPolyline');
    table.specificType('season', 'INTEGER[]');
    table.text('htgtGeneral');
    table.text('htgtWinter');
    table.text('htgtSummer');
    table.text('htgtPublicTransport');
    table.boolean('htgtCarAllYear');
    table.boolean('htgtCarSummer');
    table.boolean('htgtBicycle');
    table.boolean('htgtPublicTransportAvailable');
    table.boolean('htgtBoatTransportAvailable');
    table.text('license');
    table.text('provider')
      .notNullable();
    table.text('status')
      .notNullable()
      .references('name')
      .inTable('documentStatuses');
    table.text('dataSource');
    table.float('searchDocumentBoost', 8, 2);
    table.specificType('searchNb', 'TSVECTOR');
    table.specificType('searchEn', 'TSVECTOR');

    table.timestamps(true, true);

    table.index('searchNb', null, 'gin');
  });

  // Create name_lower_case trigger procedure for 'trips'-table
  await knex.schema.raw([
    'CREATE FUNCTION trips_name_lower_case_trigger() RETURNS trigger AS $$',
    'BEGIN',
    '  NEW.name_lower_case := lower(NEW.name);',
    '  RETURN NEW;',
    'END',
    '$$ LANGUAGE plpgsql;',
  ].join('\n'));

  // // Create tsvector trigger procedure for 'trips'-table
  await knex.schema.raw([
    'CREATE FUNCTION trips_tsvector_trigger() RETURNS trigger AS $$',
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
  ].join('\n'));

  // // Create search document trigger procedure for 'trips'-table
  await knex.schema.raw([
    'CREATE FUNCTION trips_search_document_trigger() RETURNS trigger AS $$',
    'DECLARE',
    '  boost FLOAT;',
    'BEGIN',

    '  SELECT sbc.boost INTO boost',
    '  FROM search_config AS sbc',
    '  WHERE sbc.name = \'search_document__trip\';',

    '  INSERT INTO search_documents (',
    '    id, document_type, document_id, status, search_nb,',
    '    search_document_boost, search_document_type_boost,',
    '    created_at, updated_at',
    '  )',
    '  VALUES (',
    '    uuid_generate_v4(), \'trip\', NEW.id, NEW.status, NEW.search_nb,',
    '    NEW.search_document_boost, boost, NEW.created_at, NEW.updated_at',
    '  )',
    '  ON CONFLICT ("document_type", "document_id")',
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

  // // Use name_lower_case trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER trips_name_lower_case_update BEFORE INSERT OR UPDATE',
    'ON "trips"',
    'FOR EACH ROW EXECUTE PROCEDURE trips_name_lower_case_trigger();',
  ].join('\n'));

  // // Use tsvector trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER trips_tsvector_update BEFORE INSERT OR UPDATE',
    'ON "trips"',
    'FOR EACH ROW EXECUTE PROCEDURE trips_tsvector_trigger();',
  ].join('\n'));

  // // Use tsvector trigger before each insert or update
  await knex.schema.raw([
    'CREATE TRIGGER trips_search_document_update AFTER INSERT OR UPDATE',
    'ON "trips"',
    'FOR EACH ROW EXECUTE PROCEDURE trips_search_document_trigger();',
  ].join('\n'));
}


async function createTripLinks(knex) {
  await knex.schema.createTable('tripLinks', (table) => {
    table.uuid('id')
      .primary();
    table.uuid('tripId')
      .notNullable()
      .references('id')
      .inTable('trips');
    table.text('type');
    table.text('title');
    table.text('url')
      .notNullable();
    table.integer('sortIndex');
    table.text('dataSource');

    table.timestamps(true, true);

    table.unique(['tripId', 'sortIndex']);
  });
}


async function createTripsToActivityTypes(knex) {
  await knex.schema.createTable('tripsToActivityTypes', (table) => {
    table.uuid('tripId')
      .notNullable()
      .references('id')
      .inTable('trips');
    table.text('activityTypeName')
      .notNullable()
      .references('name')
      .inTable('activityTypes');
    table.boolean('primary')
      .notNullable();
    table.integer('sortIndex');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['tripId', 'activityTypeName']);
  });
}


async function createTripsToGroups(knex) {
  await knex.schema.createTable('tripsToGroups', (table) => {
    table.uuid('tripId')
      .notNullable()
      .references('id')
      .inTable('trips');
    table.uuid('groupId')
      .notNullable()
      .references('id')
      .inTable('groups');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['tripId', 'groupId']);
  });
}


async function createTripsToPois(knex) {
  await knex.schema.createTable('tripsToPois', (table) => {
    table.uuid('tripId')
      .notNullable()
      .references('id')
      .inTable('trips');
    table.uuid('poiId')
      .notNullable()
      .references('id')
      .inTable('pois');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['tripId', 'poiId']);
  });
}


async function createUuid(knex) {
  await knex.schema.createTable('uuids', (table) => {
    table.uuid('id')
      .primary();
    table.text('documentType')
      .notNullable();
  });

  await Promise.all(
    uuidTables.map(async (meta) => {
      const tn = _.snakeCase(meta[0]);
      const [, dt] = meta;

      // Create insert trigger procedure
      await knex.schema.raw([
        `CREATE FUNCTION ${tn}_uuid_insert_trigger() RETURNS trigger AS $$`,
        'BEGIN',
        '  INSERT INTO "public"."uuids" (id, document_type)',
        `  VALUES (NEW.id, '${dt}');`,
        '  RETURN NEW;',
        'END',
        '$$ LANGUAGE plpgsql;',
      ].join('\n'));

      // Create delete trigger procedure
      await knex.schema.raw([
        `CREATE FUNCTION ${tn}_uuid_delete_trigger() RETURNS trigger AS $$`,
        'BEGIN',
        '  DELETE FROM "public"."uuids" WHERE id = OLD.id;',
        '  RETURN NEW;',
        'END',
        '$$ LANGUAGE plpgsql;',
      ].join('\n'));

      // // Use trigger after each insert
      await knex.schema.raw([
        `CREATE TRIGGER ${tn}_uuid_insert AFTER INSERT`,
        `ON "${tn}"`,
        `FOR EACH ROW EXECUTE PROCEDURE ${tn}_uuid_insert_trigger();`,
      ].join('\n'));

      // // Use trigger after each delete
      await knex.schema.raw([
        `CREATE TRIGGER ${tn}_uuid_delete AFTER DELETE`,
        `ON "${tn}"`,
        `FOR EACH ROW EXECUTE PROCEDURE ${tn}_uuid_delete_trigger();`,
      ].join('\n'));
    })
  );
}


async function destroyUuidTriggers(knex) {
  await Promise.all(
    uuidTables.map(async (meta) => {
      const tn = _.snakeCase(meta[0]);

      await knex.schema
        .raw(`DROP TRIGGER IF EXISTS ${tn}_uuid_insert ON "${tn}";`)
        .raw(`DROP TRIGGER IF EXISTS ${tn}_uuid_delete ON "${tn}";`)
        .raw(`DROP FUNCTION IF EXISTS ${tn}_uuid_insert_trigger();`)
        .raw(`DROP FUNCTION IF EXISTS ${tn}_uuid_delete_trigger();`);
    })
  );
}


export async function up(knex) {
  await createSearchConfig(knex);
  await createDocumentStatuses(knex);
  await createSearchDocuments(knex);
  await createCounties(knex);
  await createCountyTranslations(knex);
  await createMunicipalities(knex);
  await createMunicipalityTranslations(knex);
  await createCabinPictureTypes(knex);
  await createPictures(knex);
  await createAreas(knex);
  await createAreasToAreas(knex);
  await createAreasToCounties(knex);
  await createAreasToMunicipalities(knex);
  await createGroupTypes(knex);
  await createGroups(knex);
  await createGroupLinks(knex);
  await createAccessabilities(knex);
  await createFacilities(knex);
  await createCabinServiceLevels(knex);
  await createCabins(knex);
  await createCabinTranslations(knex);
  await createCabinLinks(knex);
  await createCabinAccessabilities(knex);
  await createCabinFacilities(knex);
  await createCabinOpeningHoursKeyTypes(knex);
  await createCabinOpeningHours(knex);
  await createCabinsToAreas(knex);
  await createActivityTypes(knex);
  await createActivityTypesToActivityTypes(knex);
  await createGradings(knex);
  await createListTypes(knex);
  await createLists(knex);
  await createListLinks(knex);
  await createListRelations(knex);
  await createListsToCounties(knex);
  await createListsToMunicipalities(knex);
  await createListsToGroups(knex);
  await createPoiTypes(knex);
  await createPois(knex);
  await createPoisToPoiTypes(knex);
  await createPoiAccessabilities(knex);
  await createPoiLinks(knex);
  await createPoisToAreas(knex);
  await createPoisToGroups(knex);
  await createRoutes(knex);
  await createRouteLinks(knex);
  await createRoutesToActivityTypes(knex);
  await createRoutesToCounties(knex);
  await createRoutesToGroups(knex);
  await createRoutesToPois(knex);
  await createRouteWaymarkTypes(knex);
  await createRoutesToRouteWaymarkTypes(knex);
  await createTripDirections(knex);
  await createTrips(knex);
  await createTripLinks(knex);
  await createTripsToActivityTypes(knex);
  await createTripsToGroups(knex);
  await createTripsToPois(knex);
  await createUuid(knex);
}


export async function down(knex) {
  await destroyUuidTriggers(knex);

  // Remove 'areas' triggers
  await knex.schema
    .raw('DROP TRIGGER IF EXISTS areas_name_lower_case_update ON "areas";')
    .raw('DROP TRIGGER IF EXISTS areas_tsvector_update ON "areas";')
    .raw('DROP TRIGGER IF EXISTS areas_search_document_update ON "areas";')
    .raw('DROP FUNCTION IF EXISTS areas_name_lower_case_trigger();')
    .raw('DROP FUNCTION IF EXISTS areas_tsvector_trigger();')
    .raw('DROP FUNCTION IF EXISTS areas_search_document_trigger();');

  // Remove 'groups' triggers
  await knex.schema
    .raw('DROP TRIGGER IF EXISTS groups_name_lower_case_update ON "groups";')
    .raw('DROP TRIGGER IF EXISTS groups_tsvector_update ON "groups";')
    .raw('DROP TRIGGER IF EXISTS groups_search_document_update ON "groups";')
    .raw('DROP FUNCTION IF EXISTS groups_name_lower_case_trigger();')
    .raw('DROP FUNCTION IF EXISTS groups_tsvector_trigger();')
    .raw('DROP FUNCTION IF EXISTS groups_search_document_trigger();');

  // Remove 'cabins' triggers
  await knex.schema
    .raw('DROP TRIGGER IF EXISTS cabins_name_lower_case_update ON "cabins";')
    .raw('DROP TRIGGER IF EXISTS cabins_tsvector_update ON "cabins";')
    .raw('DROP TRIGGER IF EXISTS cabins_search_document_update ON "cabins";')
    .raw('DROP FUNCTION IF EXISTS cabins_name_lower_case_trigger();')
    .raw('DROP FUNCTION IF EXISTS cabins_tsvector_trigger();')
    .raw('DROP FUNCTION IF EXISTS cabins_search_document_trigger();');

  // Remove 'cabinTranslations' triggers
  await knex.schema
    .raw(
      'DROP TRIGGER IF EXISTS cabin_translations_update_trigger ON ' +
      '"cabin_translations";'
    )
    .raw(
      'DROP TRIGGER IF EXISTS cabin_translations_delete_trigger ON ' +
      '"cabin_translations";'
    )
    .raw('DROP FUNCTION IF EXISTS cabin_translations_on_insert_or_update();')
    .raw('DROP FUNCTION IF EXISTS cabin_translations_on_delete();');

  // Remove 'lists' triggers
  await knex.schema
    .raw('DROP TRIGGER IF EXISTS lists_name_lower_case_update ON "lists";')
    .raw('DROP TRIGGER IF EXISTS lists_tsvector_update ON "lists";')
    .raw('DROP TRIGGER IF EXISTS lists_search_document_update ON "lists";')
    .raw('DROP FUNCTION IF EXISTS lists_name_lower_case_trigger();')
    .raw('DROP FUNCTION IF EXISTS lists_tsvector_trigger();')
    .raw('DROP FUNCTION IF EXISTS lists_search_document_trigger();');

  // Remove 'pois' triggers
  await knex.schema
    .raw('DROP TRIGGER IF EXISTS pois_name_lower_case_update ON "pois";')
    .raw('DROP TRIGGER IF EXISTS pois_tsvector_update ON "pois";')
    .raw('DROP TRIGGER IF EXISTS pois_search_document_update ON "pois";')
    .raw('DROP FUNCTION IF EXISTS pois_name_lower_case_trigger();')
    .raw('DROP FUNCTION IF EXISTS pois_tsvector_trigger();')
    .raw('DROP FUNCTION IF EXISTS pois_search_document_trigger();');

  // Remove 'routes' triggers
  await knex.schema
    .raw('DROP TRIGGER IF EXISTS routes_name_lower_case_update ON "routes";')
    .raw('DROP TRIGGER IF EXISTS routes_tsvector_update ON "routes";')
    .raw('DROP TRIGGER IF EXISTS routes_search_document_update ON "routes";')
    .raw('DROP FUNCTION IF EXISTS routes_name_lower_case_trigger();')
    .raw('DROP FUNCTION IF EXISTS routes_tsvector_trigger();')
    .raw('DROP FUNCTION IF EXISTS routes_search_document_trigger();');

  // Remove 'trips' triggers
  await knex.schema
    .raw('DROP TRIGGER IF EXISTS trips_name_lower_case_update ON "trips";')
    .raw('DROP TRIGGER IF EXISTS trips_tsvector_update ON "trips";')
    .raw('DROP TRIGGER IF EXISTS trips_search_document_update ON "trips";')
    .raw('DROP FUNCTION IF EXISTS trips_name_lower_case_trigger();')
    .raw('DROP FUNCTION IF EXISTS trips_tsvector_trigger();')
    .raw('DROP FUNCTION IF EXISTS trips_search_document_trigger();');

  // Drop tables
  await knex.schema
    .dropTableIfExists('uuids')
    .dropTableIfExists('tripsToPois')
    .dropTableIfExists('tripsToGroups')
    .dropTableIfExists('tripsToActivityTypes')
    .dropTableIfExists('tripLinks')
    .dropTableIfExists('trips')
    .dropTableIfExists('tripDirections')
    .dropTableIfExists('routesToRouteWaymarkTypes')
    .dropTableIfExists('routeWaymarkTypes')
    .dropTableIfExists('routesToPois')
    .dropTableIfExists('routesToGroups')
    .dropTableIfExists('routesToCounties')
    .dropTableIfExists('routesToActivityTypes')
    .dropTableIfExists('routeLinks')
    .dropTableIfExists('routes')
    .dropTableIfExists('poisToGroups')
    .dropTableIfExists('poisToAreas')
    .dropTableIfExists('poiLinks')
    .dropTableIfExists('poiAccessabilities')
    .dropTableIfExists('poisToPoiTypes')
    .dropTableIfExists('pois')
    .dropTableIfExists('poiTypes')
    .dropTableIfExists('listsToGroups')
    .dropTableIfExists('listsToMunicipalities')
    .dropTableIfExists('listsToCounties')
    .dropTableIfExists('listRelations')
    .dropTableIfExists('listLinks')
    .dropTableIfExists('lists')
    .dropTableIfExists('listTypes')
    .dropTableIfExists('gradings')
    .dropTableIfExists('activityTypesToActivityTypes')
    .dropTableIfExists('activityTypes')
    .dropTableIfExists('cabinsToAreas')
    .dropTableIfExists('cabinOpeningHours')
    .dropTableIfExists('cabinOpeningHoursKeyTypes')
    .dropTableIfExists('cabinFacilities')
    .dropTableIfExists('cabinAccessabilities')
    .dropTableIfExists('cabinLinks')
    .dropTableIfExists('cabinTranslations')
    .dropTableIfExists('cabins')
    .dropTableIfExists('cabinServiceLevels')
    .dropTableIfExists('facilities')
    .dropTableIfExists('accessabilities')
    .dropTableIfExists('groupLinks')
    .dropTableIfExists('groups')
    .dropTableIfExists('groupTypes')
    .dropTableIfExists('areasToMunicipalities')
    .dropTableIfExists('areasToCounties')
    .dropTableIfExists('areasToAreas')
    .dropTableIfExists('areas')
    .dropTableIfExists('pictures')
    .dropTableIfExists('cabinPictureTypes')
    .dropTableIfExists('municipalityTranslations')
    .dropTableIfExists('municipalities')
    .dropTableIfExists('countyTranslations')
    .dropTableIfExists('counties')
    .dropTableIfExists('searchDocuments')
    .dropTableIfExists('documentStatuses')
    .dropTableIfExists('searchConfig');
}

-- ----------------------------
--  Table structure for accessability
-- ----------------------------
DROP TABLE IF EXISTS "public"."accessability";
CREATE TABLE "public"."accessability" (
	"name" text NOT NULL COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."accessability" OWNER TO "ntb";

-- ----------------------------
--  Table structure for activity_type_to_activity_type
-- ----------------------------
DROP TABLE IF EXISTS "public"."activity_type_to_activity_type";
CREATE TABLE "public"."activity_type_to_activity_type" (
	"primary_type" text NOT NULL COLLATE "default",
	"sub_type" text NOT NULL COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."activity_type_to_activity_type" OWNER TO "ntb";

-- ----------------------------
--  Table structure for area_to_county
-- ----------------------------
DROP TABLE IF EXISTS "public"."area_to_county";
CREATE TABLE "public"."area_to_county" (
	"area_uuid" uuid NOT NULL,
	"county_uuid" uuid NOT NULL,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."area_to_county" OWNER TO "ntb";

-- ----------------------------
--  Table structure for area_to_area
-- ----------------------------
DROP TABLE IF EXISTS "public"."area_to_area";
CREATE TABLE "public"."area_to_area" (
	"parent_uuid" uuid NOT NULL,
	"child_uuid" uuid NOT NULL,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."area_to_area" OWNER TO "ntb";

-- ----------------------------
--  Table structure for area_to_municipality
-- ----------------------------
DROP TABLE IF EXISTS "public"."area_to_municipality";
CREATE TABLE "public"."area_to_municipality" (
	"area_uuid" uuid NOT NULL,
	"municipality_uuid" uuid NOT NULL,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."area_to_municipality" OWNER TO "ntb";

-- ----------------------------
--  Table structure for area
-- ----------------------------
DROP TABLE IF EXISTS "public"."area";
CREATE TABLE "public"."area" (
	"uuid" uuid NOT NULL,
	"id_legacy_ntb" text COLLATE "default",
	"name" text NOT NULL COLLATE "default",
	"name_lower_case" text NOT NULL COLLATE "default",
	"description" text COLLATE "default",
	"description_plain" text COLLATE "default",
	"geometry" "public"."geometry",
	"map" text COLLATE "default",
	"url" text COLLATE "default",
	"license" text COLLATE "default",
	"provider" text NOT NULL COLLATE "default",
	"status" text NOT NULL COLLATE "default",
	"data_source" text COLLATE "default",
	"search_document_boost" float8 NOT NULL,
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."area" OWNER TO "ntb";

-- ----------------------------
--  Table structure for activity_type
-- ----------------------------
DROP TABLE IF EXISTS "public"."activity_type";
CREATE TABLE "public"."activity_type" (
	"name" text NOT NULL COLLATE "default",
	"primary" bool NOT NULL,
	"description" text COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."activity_type" OWNER TO "ntb";

-- ----------------------------
--  Table structure for group_type
-- ----------------------------
DROP TABLE IF EXISTS "public"."group_type";
CREATE TABLE "public"."group_type" (
	"name" text NOT NULL COLLATE "default",
	"parent" text COLLATE "default",
	"description" text COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."group_type" OWNER TO "ntb";

-- ----------------------------
--  Table structure for county_translation
-- ----------------------------
DROP TABLE IF EXISTS "public"."county_translation";
CREATE TABLE "public"."county_translation" (
	"uuid" uuid NOT NULL,
	"county_uuid" uuid,
	"name" text NOT NULL COLLATE "default",
	"name_lower_case" text NOT NULL COLLATE "default",
	"language" text NOT NULL COLLATE "default",
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."county_translation" OWNER TO "ntb";

-- ----------------------------
--  Table structure for cabin_picture_type
-- ----------------------------
DROP TABLE IF EXISTS "public"."cabin_picture_type";
CREATE TABLE "public"."cabin_picture_type" (
	"name" text NOT NULL COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."cabin_picture_type" OWNER TO "ntb";

-- ----------------------------
--  Table structure for list_type
-- ----------------------------
DROP TABLE IF EXISTS "public"."list_type";
CREATE TABLE "public"."list_type" (
	"name" text NOT NULL COLLATE "default",
	"description" text COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."list_type" OWNER TO "ntb";

-- ----------------------------
--  Table structure for cabin_accessability
-- ----------------------------
DROP TABLE IF EXISTS "public"."cabin_accessability";
CREATE TABLE "public"."cabin_accessability" (
	"accessability_name" text NOT NULL COLLATE "default",
	"cabin_uuid" uuid NOT NULL,
	"description" text COLLATE "default",
	"data_source" text COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."cabin_accessability" OWNER TO "ntb";

-- ----------------------------
--  Table structure for municipality
-- ----------------------------
DROP TABLE IF EXISTS "public"."municipality";
CREATE TABLE "public"."municipality" (
	"uuid" uuid NOT NULL,
	"code" text NOT NULL COLLATE "default",
	"name" text NOT NULL COLLATE "default",
	"name_lower_case" text NOT NULL COLLATE "default",
	"status" text NOT NULL COLLATE "default",
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"county_uuid" uuid
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."municipality" OWNER TO "ntb";

-- ----------------------------
--  Table structure for cabin_link
-- ----------------------------
DROP TABLE IF EXISTS "public"."cabin_link";
CREATE TABLE "public"."cabin_link" (
	"uuid" uuid NOT NULL,
	"cabin_uuid" uuid,
	"type" text NOT NULL COLLATE "default",
	"title" text COLLATE "default",
	"url" text NOT NULL COLLATE "default",
	"sort_index" int4,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."cabin_link" OWNER TO "ntb";

-- ----------------------------
--  Table structure for list_relation
-- ----------------------------
DROP TABLE IF EXISTS "public"."list_relation";
CREATE TABLE "public"."list_relation" (
	"list_uuid" uuid,
	"document_type" text NOT NULL COLLATE "default",
	"document_uuid" uuid NOT NULL,
	"sort_index" int4,
	"data_source" text COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."list_relation" OWNER TO "ntb";

-- ----------------------------
--  Table structure for group
-- ----------------------------
DROP TABLE IF EXISTS "public"."group";
CREATE TABLE "public"."group" (
	"uuid" uuid NOT NULL,
	"id_legacy_ntb" text COLLATE "default",
	"group_type" text COLLATE "default",
	"group_sub_type" text COLLATE "default",
	"name" text NOT NULL COLLATE "default",
	"name_lower_case" text NOT NULL COLLATE "default",
	"description" text COLLATE "default",
	"description_plain" text COLLATE "default",
	"logo" text COLLATE "default",
	"organization_number" text COLLATE "default",
	"url" text COLLATE "default",
	"email" text COLLATE "default",
	"phone" text COLLATE "default",
	"mobile" text COLLATE "default",
	"fax" text COLLATE "default",
	"address_1" text COLLATE "default",
	"address_2" text COLLATE "default",
	"postal_code" text COLLATE "default",
	"postal_name" text COLLATE "default",
	"license" text COLLATE "default",
	"provider" text COLLATE "default",
	"status" text NOT NULL COLLATE "default",
	"data_source" text COLLATE "default",
	"search_document_boost" float8 NOT NULL,
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"municipality_uuid" uuid
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."group" OWNER TO "ntb";

-- ----------------------------
--  Table structure for list_to_municipality
-- ----------------------------
DROP TABLE IF EXISTS "public"."list_to_municipality";
CREATE TABLE "public"."list_to_municipality" (
	"list_uuid" uuid NOT NULL,
	"municipality_uuid" uuid NOT NULL,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."list_to_municipality" OWNER TO "ntb";

-- ----------------------------
--  Table structure for cabin_service_level
-- ----------------------------
DROP TABLE IF EXISTS "public"."cabin_service_level";
CREATE TABLE "public"."cabin_service_level" (
	"name" text NOT NULL COLLATE "default",
	"description" text COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."cabin_service_level" OWNER TO "ntb";

-- ----------------------------
--  Table structure for group_link
-- ----------------------------
DROP TABLE IF EXISTS "public"."group_link";
CREATE TABLE "public"."group_link" (
	"uuid" uuid NOT NULL,
	"group_uuid" uuid,
	"type" text NOT NULL COLLATE "default",
	"title" text COLLATE "default",
	"url" text NOT NULL COLLATE "default",
	"sort_index" int4,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."group_link" OWNER TO "ntb";

-- ----------------------------
--  Table structure for cabin_opening_hours
-- ----------------------------
DROP TABLE IF EXISTS "public"."cabin_opening_hours";
CREATE TABLE "public"."cabin_opening_hours" (
	"uuid" uuid NOT NULL,
	"cabin_uuid" uuid,
	"all_year" bool NOT NULL,
	"from" timestamp(6) WITH TIME ZONE,
	"to" timestamp(6) WITH TIME ZONE,
	"service_level" text COLLATE "default",
	"key" text COLLATE "default",
	"sort_index" int4,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."cabin_opening_hours" OWNER TO "ntb";

-- ----------------------------
--  Table structure for list_to_group
-- ----------------------------
DROP TABLE IF EXISTS "public"."list_to_group";
CREATE TABLE "public"."list_to_group" (
	"list_uuid" uuid NOT NULL,
	"group_uuid" uuid NOT NULL,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."list_to_group" OWNER TO "ntb";

-- ----------------------------
--  Table structure for facility
-- ----------------------------
DROP TABLE IF EXISTS "public"."facility";
CREATE TABLE "public"."facility" (
	"name" text NOT NULL COLLATE "default",
	"description" text COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."facility" OWNER TO "ntb";

-- ----------------------------
--  Table structure for list_link
-- ----------------------------
DROP TABLE IF EXISTS "public"."list_link";
CREATE TABLE "public"."list_link" (
	"uuid" uuid NOT NULL,
	"list_uuid" uuid NOT NULL,
	"type" text NOT NULL COLLATE "default",
	"title" text COLLATE "default",
	"url" text NOT NULL COLLATE "default",
	"sort_index" int4,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."list_link" OWNER TO "ntb";

-- ----------------------------
--  Table structure for cabin_translation
-- ----------------------------
DROP TABLE IF EXISTS "public"."cabin_translation";
CREATE TABLE "public"."cabin_translation" (
	"uuid" uuid NOT NULL,
	"cabin_uuid" uuid NOT NULL,
	"name" text NOT NULL COLLATE "default",
	"name_lower_case" text NOT NULL COLLATE "default",
	"description" text COLLATE "default",
	"description_plain" text COLLATE "default",
	"language" text NOT NULL COLLATE "default",
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."cabin_translation" OWNER TO "ntb";

-- ----------------------------
--  Table structure for cabin_facility
-- ----------------------------
DROP TABLE IF EXISTS "public"."cabin_facility";
CREATE TABLE "public"."cabin_facility" (
	"facility_name" text NOT NULL COLLATE "default",
	"cabin_uuid" uuid NOT NULL,
	"description" text COLLATE "default",
	"data_source" text COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."cabin_facility" OWNER TO "ntb";

-- ----------------------------
--  Table structure for cabin
-- ----------------------------
DROP TABLE IF EXISTS "public"."cabin";
CREATE TABLE "public"."cabin" (
	"uuid" uuid NOT NULL,
	"id_legacy_ntb" text COLLATE "default",
	"id_ssr" text COLLATE "default",
	"dnt_cabin" bool NOT NULL,
	"dnt_discount" bool NOT NULL,
	"maintainer_group_uuid" uuid,
	"owner_group_uuid" uuid,
	"contact_group_uuid" uuid,
	"name" text NOT NULL COLLATE "default",
	"name_lower_case" text NOT NULL COLLATE "default",
	"name_alt" text[] COLLATE "default",
	"name_alt_lower_case" text[] COLLATE "default",
	"description" text COLLATE "default",
	"description_plain" text COLLATE "default",
	"contact_name" text COLLATE "default",
	"email" text COLLATE "default",
	"phone" text COLLATE "default",
	"mobile" text COLLATE "default",
	"fax" text COLLATE "default",
	"address_1" text COLLATE "default",
	"address_2" text COLLATE "default",
	"postal_code" text COLLATE "default",
	"postal_name" text COLLATE "default",
	"url" text COLLATE "default",
	"year_of_construction" int4,
	"coordinate" "public"."geometry",
	"county_uuid" uuid,
	"municipality_uuid" uuid,
	"service_level" text COLLATE "default",
	"beds_extra" int4 NOT NULL,
	"beds_serviced" int4 NOT NULL,
	"beds_self_service" int4 NOT NULL,
	"beds_unmanned" int4 NOT NULL,
	"beds_winter" int4 NOT NULL,
	"booking_enabled" bool NOT NULL,
	"booking_only" bool NOT NULL,
	"booking_url" text COLLATE "default",
	"htgt_general" text COLLATE "default",
	"htgt_winter" text COLLATE "default",
	"htgt_summer" text COLLATE "default",
	"htgt_public_transport" text COLLATE "default",
	"htgt_car_all_year" bool,
	"htgt_car_summer" bool,
	"htgt_bicycle" bool,
	"htgt_public_transport_available" bool,
	"map" text COLLATE "default",
	"map_alt" text[] COLLATE "default",
	"license" text COLLATE "default",
	"provider" text COLLATE "default",
	"status" text NOT NULL COLLATE "default",
	"data_source" text COLLATE "default",
	"search_document_boost" float8 NOT NULL,
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."cabin" OWNER TO "ntb";

-- ----------------------------
--  Table structure for trip_direction
-- ----------------------------
DROP TABLE IF EXISTS "public"."trip_direction";
CREATE TABLE "public"."trip_direction" (
	"name" text NOT NULL COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."trip_direction" OWNER TO "ntb";

-- ----------------------------
--  Table structure for poi_type
-- ----------------------------
DROP TABLE IF EXISTS "public"."poi_type";
CREATE TABLE "public"."poi_type" (
	"name" text NOT NULL COLLATE "default",
	"description" text COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."poi_type" OWNER TO "ntb";

-- ----------------------------
--  Table structure for list_to_county
-- ----------------------------
DROP TABLE IF EXISTS "public"."list_to_county";
CREATE TABLE "public"."list_to_county" (
	"list_uuid" uuid NOT NULL,
	"county_uuid" uuid NOT NULL,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."list_to_county" OWNER TO "ntb";

-- ----------------------------
--  Table structure for cabin_opening_hours_key_type
-- ----------------------------
DROP TABLE IF EXISTS "public"."cabin_opening_hours_key_type";
CREATE TABLE "public"."cabin_opening_hours_key_type" (
	"name" text NOT NULL COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."cabin_opening_hours_key_type" OWNER TO "ntb";

-- ----------------------------
--  Table structure for cabin_to_area
-- ----------------------------
DROP TABLE IF EXISTS "public"."cabin_to_area";
CREATE TABLE "public"."cabin_to_area" (
	"cabin_uuid" uuid NOT NULL,
	"area_uuid" uuid NOT NULL,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."cabin_to_area" OWNER TO "ntb";

-- ----------------------------
--  Table structure for list
-- ----------------------------
DROP TABLE IF EXISTS "public"."list";
CREATE TABLE "public"."list" (
	"uuid" uuid NOT NULL,
	"id_legacy_ntb" text COLLATE "default",
	"list_type" text NOT NULL COLLATE "default",
	"name" text NOT NULL COLLATE "default",
	"name_lower_case" text NOT NULL COLLATE "default",
	"description" text COLLATE "default",
	"description_plain" text COLLATE "default",
	"coordinates" "public"."geometry",
	"start_date" timestamp(6) WITH TIME ZONE,
	"end_date" timestamp(6) WITH TIME ZONE,
	"license" text COLLATE "default",
	"provider" text COLLATE "default",
	"status" text NOT NULL COLLATE "default",
	"data_source" text COLLATE "default",
	"search_document_boost" float8 NOT NULL,
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."list" OWNER TO "ntb";

-- ----------------------------
--  Table structure for municipality_translation
-- ----------------------------
DROP TABLE IF EXISTS "public"."municipality_translation";
CREATE TABLE "public"."municipality_translation" (
	"uuid" uuid NOT NULL,
	"municipality_uuid" uuid,
	"name" text NOT NULL COLLATE "default",
	"name_lower_case" text NOT NULL COLLATE "default",
	"language" text NOT NULL COLLATE "default",
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."municipality_translation" OWNER TO "ntb";

-- ----------------------------
--  Table structure for grading
-- ----------------------------
DROP TABLE IF EXISTS "public"."grading";
CREATE TABLE "public"."grading" (
	"name" text NOT NULL COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."grading" OWNER TO "ntb";

-- ----------------------------
--  Table structure for route_waymark_type
-- ----------------------------
DROP TABLE IF EXISTS "public"."route_waymark_type";
CREATE TABLE "public"."route_waymark_type" (
	"name" text NOT NULL COLLATE "default",
	"description" text COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."route_waymark_type" OWNER TO "ntb";

-- ----------------------------
--  Table structure for poi_to_poi_type
-- ----------------------------
DROP TABLE IF EXISTS "public"."poi_to_poi_type";
CREATE TABLE "public"."poi_to_poi_type" (
	"poi_type" text NOT NULL COLLATE "default",
	"poi_uuid" uuid NOT NULL,
	"primary" bool,
	"sort_index" int4,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."poi_to_poi_type" OWNER TO "ntb";

-- ----------------------------
--  Table structure for poi
-- ----------------------------
DROP TABLE IF EXISTS "public"."poi";
CREATE TABLE "public"."poi" (
	"uuid" uuid NOT NULL,
	"id_legacy_ntb" text COLLATE "default",
	"id_ssr" text COLLATE "default",
	"type" text NOT NULL COLLATE "default",
	"name" text NOT NULL COLLATE "default",
	"name_lower_case" text NOT NULL COLLATE "default",
	"description" text COLLATE "default",
	"description_plain" text COLLATE "default",
	"coordinate" "public"."geometry",
	"season" int4[],
	"open" bool,
	"county_uuid" uuid,
	"municipality_uuid" uuid,
	"license" text COLLATE "default",
	"provider" text COLLATE "default",
	"status" text NOT NULL COLLATE "default",
	"data_source" text COLLATE "default",
	"search_document_boost" float8 NOT NULL,
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."poi" OWNER TO "ntb";

-- ----------------------------
--  Table structure for document_status
-- ----------------------------
DROP TABLE IF EXISTS "public"."document_status";
CREATE TABLE "public"."document_status" (
	"name" text NOT NULL COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."document_status" OWNER TO "ntb";

-- ----------------------------
--  Table structure for route_to_county
-- ----------------------------
DROP TABLE IF EXISTS "public"."route_to_county";
CREATE TABLE "public"."route_to_county" (
	"route_uuid" uuid NOT NULL,
	"county_uuid" uuid NOT NULL,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."route_to_county" OWNER TO "ntb";

-- ----------------------------
--  Table structure for poi_link
-- ----------------------------
DROP TABLE IF EXISTS "public"."poi_link";
CREATE TABLE "public"."poi_link" (
	"uuid" uuid NOT NULL,
	"poi_uuid" uuid,
	"title" text COLLATE "default",
	"url" text NOT NULL COLLATE "default",
	"sort_index" int4,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."poi_link" OWNER TO "ntb";

-- ----------------------------
--  Table structure for trip_link
-- ----------------------------
DROP TABLE IF EXISTS "public"."trip_link";
CREATE TABLE "public"."trip_link" (
	"uuid" uuid NOT NULL,
	"trip_uuid" uuid,
	"title" text COLLATE "default",
	"url" text NOT NULL COLLATE "default",
	"sort_index" int4,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."trip_link" OWNER TO "ntb";

-- ----------------------------
--  Table structure for route_to_group
-- ----------------------------
DROP TABLE IF EXISTS "public"."route_to_group";
CREATE TABLE "public"."route_to_group" (
	"route_uuid" uuid NOT NULL,
	"group_uuid" uuid NOT NULL,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."route_to_group" OWNER TO "ntb";

-- ----------------------------
--  Table structure for picture
-- ----------------------------
DROP TABLE IF EXISTS "public"."picture";
CREATE TABLE "public"."picture" (
	"uuid" uuid NOT NULL,
	"id_legacy_ntb" text COLLATE "default",
	"area_uuid" uuid,
	"cabin_uuid" uuid,
	"list_uuid" uuid,
	"poi_uuid" uuid,
	"route_uuid" uuid,
	"trip_uuid" uuid,
	"sort_index" int4,
	"cabin_picture_type" text COLLATE "default",
	"photographer_name" text COLLATE "default",
	"photographer_email" text COLLATE "default",
	"photographer_credit" text COLLATE "default",
	"description" text COLLATE "default",
	"coordinates" "public"."geometry",
	"original" jsonb,
	"exif" jsonb,
	"versions" jsonb,
	"license" text COLLATE "default",
	"provider" text NOT NULL COLLATE "default",
	"legacy_first_tag" text COLLATE "default",
	"legacy_tags" text[] COLLATE "default",
	"status" text NOT NULL COLLATE "default",
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."picture" OWNER TO "ntb";

-- ----------------------------
--  Table structure for poi_to_area
-- ----------------------------
DROP TABLE IF EXISTS "public"."poi_to_area";
CREATE TABLE "public"."poi_to_area" (
	"poi_uuid" uuid NOT NULL,
	"area_uuid" uuid NOT NULL,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."poi_to_area" OWNER TO "ntb";

-- ----------------------------
--  Table structure for trip_to_poi
-- ----------------------------
DROP TABLE IF EXISTS "public"."trip_to_poi";
CREATE TABLE "public"."trip_to_poi" (
	"trip_uuid" uuid NOT NULL,
	"poi_uuid" uuid NOT NULL,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."trip_to_poi" OWNER TO "ntb";

-- ----------------------------
--  Table structure for route_to_route_waymark_type
-- ----------------------------
DROP TABLE IF EXISTS "public"."route_to_route_waymark_type";
CREATE TABLE "public"."route_to_route_waymark_type" (
	"route_waymark_type_name" text NOT NULL COLLATE "default",
	"route_uuid" uuid NOT NULL,
	"data_source" text COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."route_to_route_waymark_type" OWNER TO "ntb";

-- ----------------------------
--  Table structure for route_link
-- ----------------------------
DROP TABLE IF EXISTS "public"."route_link";
CREATE TABLE "public"."route_link" (
	"uuid" uuid NOT NULL,
	"route_uuid" uuid,
	"title" text COLLATE "default",
	"url" text NOT NULL COLLATE "default",
	"sort_index" int4,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."route_link" OWNER TO "ntb";

-- ----------------------------
--  Table structure for route
-- ----------------------------
DROP TABLE IF EXISTS "public"."route";
CREATE TABLE "public"."route" (
	"uuid" uuid NOT NULL,
	"id_legacy_ntb_ab" text COLLATE "default",
	"id_legacy_ntb_ba" text COLLATE "default",
	"code" text NOT NULL COLLATE "default",
	"is_winter" bool NOT NULL,
	"name" text NOT NULL COLLATE "default",
	"name_lower_case" text NOT NULL COLLATE "default",
	"description" text COLLATE "default",
	"description_plain" text COLLATE "default",
	"description_ab" text COLLATE "default",
	"description_ab_plain" text COLLATE "default",
	"description_ba" text COLLATE "default",
	"description_ba_plain" text COLLATE "default",
	"url" text COLLATE "default",
	"source" text COLLATE "default",
	"notes" text COLLATE "default",
	"grading" text COLLATE "default",
	"suitable_for_children" bool NOT NULL DEFAULT false,
	"distance" int4,
	"waymark_winter_all_year" bool NOT NULL,
	"waymark_winter_from" timestamp(6) WITH TIME ZONE,
	"waymark_winter_to" timestamp(6) WITH TIME ZONE,
	"waymark_winter_comment" text COLLATE "default",
	"duration_minutes" int4,
	"duration_hours" int4,
	"duration_days" int4,
	"point_a" "public"."geometry",
	"point_b" "public"."geometry",
	"path_ab_geojson" "public"."geometry",
	"path_ba_geojson" "public"."geometry",
	"path_ab_polyline" text COLLATE "default",
	"path_ba_polyline" text COLLATE "default",
	"season" int4[],
	"license" text COLLATE "default",
	"provider" text COLLATE "default",
	"status" text NOT NULL COLLATE "default",
	"data_source" text COLLATE "default",
	"search_document_boost" float8 NOT NULL,
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."route" OWNER TO "ntb";

-- ----------------------------
--  Table structure for poi_accessability
-- ----------------------------
DROP TABLE IF EXISTS "public"."poi_accessability";
CREATE TABLE "public"."poi_accessability" (
	"accessability_name" text NOT NULL COLLATE "default",
	"poi_uuid" uuid NOT NULL,
	"description" text COLLATE "default",
	"data_source" text COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."poi_accessability" OWNER TO "ntb";

-- ----------------------------
--  Table structure for poi_to_group
-- ----------------------------
DROP TABLE IF EXISTS "public"."poi_to_group";
CREATE TABLE "public"."poi_to_group" (
	"poi_uuid" uuid NOT NULL,
	"group_uuid" uuid NOT NULL,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."poi_to_group" OWNER TO "ntb";

-- ----------------------------
--  Table structure for trip_to_activity_type
-- ----------------------------
DROP TABLE IF EXISTS "public"."trip_to_activity_type";
CREATE TABLE "public"."trip_to_activity_type" (
	"activity_type_name" text NOT NULL COLLATE "default",
	"trip_uuid" uuid NOT NULL,
	"primary" bool NOT NULL,
	"sort_index" int4,
	"data_source" text COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."trip_to_activity_type" OWNER TO "ntb";

-- ----------------------------
--  Table structure for route_to_activity_type
-- ----------------------------
DROP TABLE IF EXISTS "public"."route_to_activity_type";
CREATE TABLE "public"."route_to_activity_type" (
	"activity_type_name" text NOT NULL COLLATE "default",
	"route_uuid" uuid NOT NULL,
	"sort_index" int4,
	"data_source" text COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."route_to_activity_type" OWNER TO "ntb";

-- ----------------------------
--  Table structure for uuid
-- ----------------------------
DROP TABLE IF EXISTS "public"."uuid";
CREATE TABLE "public"."uuid" (
	"uuid" uuid NOT NULL,
	"document_type" text NOT NULL COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."uuid" OWNER TO "ntb";

-- ----------------------------
--  Table structure for route_to_poi
-- ----------------------------
DROP TABLE IF EXISTS "public"."route_to_poi";
CREATE TABLE "public"."route_to_poi" (
	"route_uuid" uuid NOT NULL,
	"poi_uuid" uuid NOT NULL,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."route_to_poi" OWNER TO "ntb";

-- ----------------------------
--  Table structure for search_config
-- ----------------------------
DROP TABLE IF EXISTS "public"."search_config";
CREATE TABLE "public"."search_config" (
	"name" text NOT NULL COLLATE "default",
	"boost" float8,
	"weight" char(1) COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."search_config" OWNER TO "ntb";

-- ----------------------------
--  Table structure for tag
-- ----------------------------
DROP TABLE IF EXISTS "public"."tag";
CREATE TABLE "public"."tag" (
	"name_lower_case" text NOT NULL COLLATE "default",
	"name" text NOT NULL COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."tag" OWNER TO "ntb";

-- ----------------------------
--  Table structure for county
-- ----------------------------
DROP TABLE IF EXISTS "public"."county";
CREATE TABLE "public"."county" (
	"uuid" uuid NOT NULL,
	"code" text NOT NULL COLLATE "default",
	"name" text NOT NULL COLLATE "default",
	"name_lower_case" text NOT NULL COLLATE "default",
	"status" text NOT NULL COLLATE "default",
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."county" OWNER TO "ntb";

-- ----------------------------
--  Table structure for search_document
-- ----------------------------
DROP TABLE IF EXISTS "public"."search_document";
CREATE TABLE "public"."search_document" (
	"uuid" uuid NOT NULL,
	"area_uuid" uuid,
	"group_uuid" uuid,
	"cabin_uuid" uuid,
	"poi_uuid" uuid,
	"trip_uuid" uuid,
	"route_uuid" uuid,
	"list_uuid" uuid,
	"county_uuid" uuid,
	"municipality_uuid" uuid,
	"status" text NOT NULL COLLATE "default",
	"search_document_boost" float8 NOT NULL,
	"search_document_type_boost" float8 NOT NULL,
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."search_document" OWNER TO "ntb";

-- ----------------------------
--  Table structure for tag_relation
-- ----------------------------
DROP TABLE IF EXISTS "public"."tag_relation";
CREATE TABLE "public"."tag_relation" (
	"tag_name" text COLLATE "default",
	"tagged_type" text NOT NULL COLLATE "default",
	"tagged_uuid" uuid,
	"data_source" text COLLATE "default"
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."tag_relation" OWNER TO "ntb";

-- ----------------------------
--  Table structure for trip_to_group
-- ----------------------------
DROP TABLE IF EXISTS "public"."trip_to_group";
CREATE TABLE "public"."trip_to_group" (
	"trip_uuid" uuid NOT NULL,
	"group_uuid" uuid NOT NULL,
	"data_source" text COLLATE "default",
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."trip_to_group" OWNER TO "ntb";

-- ----------------------------
--  Table structure for trip
-- ----------------------------
DROP TABLE IF EXISTS "public"."trip";
CREATE TABLE "public"."trip" (
	"uuid" uuid NOT NULL,
	"id_legacy_ntb" text COLLATE "default",
	"activity_type" text NOT NULL COLLATE "default",
	"name" text NOT NULL COLLATE "default",
	"name_lower_case" text NOT NULL COLLATE "default",
	"description" text COLLATE "default",
	"description_plain" text COLLATE "default",
	"url" text COLLATE "default",
	"grading" text COLLATE "default",
	"suitable_for_children" bool NOT NULL DEFAULT false,
	"distance" int4,
	"direction" text COLLATE "default",
	"duration_minutes" int4,
	"duration_hours" int4,
	"duration_days" int4,
	"starting_point" "public"."geometry",
	"path_geojson" "public"."geometry",
	"path_polyline" text COLLATE "default",
	"season" int4[],
	"htgt_general" text COLLATE "default",
	"htgt_winter" text COLLATE "default",
	"htgt_summer" text COLLATE "default",
	"htgt_public_transport" text COLLATE "default",
	"htgt_car_all_year" bool,
	"htgt_car_summer" bool,
	"htgt_bicycle" bool,
	"htgt_public_transport_available" bool,
	"license" text COLLATE "default",
	"provider" text COLLATE "default",
	"status" text NOT NULL COLLATE "default",
	"data_source" text COLLATE "default",
	"search_document_boost" float8 NOT NULL,
	"created_at" timestamp(6) WITH TIME ZONE NOT NULL,
	"updated_at" timestamp(6) WITH TIME ZONE NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "public"."trip" OWNER TO "ntb";

-- ----------------------------
--  Primary key structure for table accessability
-- ----------------------------
ALTER TABLE "public"."accessability" ADD PRIMARY KEY ("name") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table activity_type_to_activity_type
-- ----------------------------
ALTER TABLE "public"."activity_type_to_activity_type" ADD PRIMARY KEY ("primary_type", "sub_type") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table area_to_county
-- ----------------------------
ALTER TABLE "public"."area_to_county" ADD PRIMARY KEY ("area_uuid", "county_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table area_to_area
-- ----------------------------
ALTER TABLE "public"."area_to_area" ADD PRIMARY KEY ("parent_uuid", "child_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table area_to_municipality
-- ----------------------------
ALTER TABLE "public"."area_to_municipality" ADD PRIMARY KEY ("area_uuid", "municipality_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table area
-- ----------------------------
ALTER TABLE "public"."area" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table area
-- ----------------------------
ALTER TABLE "public"."area" ADD CONSTRAINT "area_id_legacy_ntb_key" UNIQUE ("id_legacy_ntb") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table activity_type
-- ----------------------------
ALTER TABLE "public"."activity_type" ADD PRIMARY KEY ("name") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table group_type
-- ----------------------------
ALTER TABLE "public"."group_type" ADD PRIMARY KEY ("name") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table county_translation
-- ----------------------------
ALTER TABLE "public"."county_translation" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table county_translation
-- ----------------------------
ALTER TABLE "public"."county_translation" ADD CONSTRAINT "county_translation_county_uuid_language_key" UNIQUE ("county_uuid","language") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table cabin_picture_type
-- ----------------------------
ALTER TABLE "public"."cabin_picture_type" ADD PRIMARY KEY ("name") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table list_type
-- ----------------------------
ALTER TABLE "public"."list_type" ADD PRIMARY KEY ("name") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table cabin_accessability
-- ----------------------------
ALTER TABLE "public"."cabin_accessability" ADD PRIMARY KEY ("accessability_name", "cabin_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table municipality
-- ----------------------------
ALTER TABLE "public"."municipality" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Indexes structure for table municipality
-- ----------------------------
CREATE INDEX  "municipality_data_source" ON "public"."municipality" USING btree(data_source COLLATE "default" "pg_catalog"."text_ops" ASC NULLS LAST);
CREATE INDEX  "municipality_name_lower_case" ON "public"."municipality" USING btree(name_lower_case COLLATE "default" "pg_catalog"."text_ops" ASC NULLS LAST);
CREATE INDEX  "municipality_status" ON "public"."municipality" USING btree(status COLLATE "default" "pg_catalog"."text_ops" ASC NULLS LAST);

-- ----------------------------
--  Primary key structure for table cabin_link
-- ----------------------------
ALTER TABLE "public"."cabin_link" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table cabin_link
-- ----------------------------
ALTER TABLE "public"."cabin_link" ADD CONSTRAINT "cabin_link_cabin_uuid_sort_index_key" UNIQUE ("cabin_uuid","sort_index") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table group
-- ----------------------------
ALTER TABLE "public"."group" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table group
-- ----------------------------
ALTER TABLE "public"."group" ADD CONSTRAINT "group_id_legacy_ntb_key" UNIQUE ("id_legacy_ntb") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table list_to_municipality
-- ----------------------------
ALTER TABLE "public"."list_to_municipality" ADD PRIMARY KEY ("list_uuid", "municipality_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table cabin_service_level
-- ----------------------------
ALTER TABLE "public"."cabin_service_level" ADD PRIMARY KEY ("name") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table group_link
-- ----------------------------
ALTER TABLE "public"."group_link" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table group_link
-- ----------------------------
ALTER TABLE "public"."group_link" ADD CONSTRAINT "group_link_group_uuid_sort_index_key" UNIQUE ("group_uuid","sort_index") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table cabin_opening_hours
-- ----------------------------
ALTER TABLE "public"."cabin_opening_hours" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table cabin_opening_hours
-- ----------------------------
ALTER TABLE "public"."cabin_opening_hours" ADD CONSTRAINT "cabin_opening_hours_cabin_uuid_sort_index_key" UNIQUE ("cabin_uuid","sort_index") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table list_to_group
-- ----------------------------
ALTER TABLE "public"."list_to_group" ADD PRIMARY KEY ("list_uuid", "group_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table facility
-- ----------------------------
ALTER TABLE "public"."facility" ADD PRIMARY KEY ("name") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table list_link
-- ----------------------------
ALTER TABLE "public"."list_link" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table list_link
-- ----------------------------
ALTER TABLE "public"."list_link" ADD CONSTRAINT "list_link_list_uuid_sort_index_key" UNIQUE ("list_uuid","sort_index") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table cabin_translation
-- ----------------------------
ALTER TABLE "public"."cabin_translation" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table cabin_translation
-- ----------------------------
ALTER TABLE "public"."cabin_translation" ADD CONSTRAINT "cabin_translation_cabin_uuid_language_key" UNIQUE ("cabin_uuid","language") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table cabin_facility
-- ----------------------------
ALTER TABLE "public"."cabin_facility" ADD PRIMARY KEY ("facility_name", "cabin_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table cabin
-- ----------------------------
ALTER TABLE "public"."cabin" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table cabin
-- ----------------------------
ALTER TABLE "public"."cabin" ADD CONSTRAINT "cabin_id_legacy_ntb_key" UNIQUE ("id_legacy_ntb") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table trip_direction
-- ----------------------------
ALTER TABLE "public"."trip_direction" ADD PRIMARY KEY ("name") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table poi_type
-- ----------------------------
ALTER TABLE "public"."poi_type" ADD PRIMARY KEY ("name") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table list_to_county
-- ----------------------------
ALTER TABLE "public"."list_to_county" ADD PRIMARY KEY ("list_uuid", "county_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table cabin_opening_hours_key_type
-- ----------------------------
ALTER TABLE "public"."cabin_opening_hours_key_type" ADD PRIMARY KEY ("name") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table cabin_to_area
-- ----------------------------
ALTER TABLE "public"."cabin_to_area" ADD PRIMARY KEY ("cabin_uuid", "area_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table list
-- ----------------------------
ALTER TABLE "public"."list" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table list
-- ----------------------------
ALTER TABLE "public"."list" ADD CONSTRAINT "list_id_legacy_ntb_key" UNIQUE ("id_legacy_ntb") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table municipality_translation
-- ----------------------------
ALTER TABLE "public"."municipality_translation" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table municipality_translation
-- ----------------------------
ALTER TABLE "public"."municipality_translation" ADD CONSTRAINT "municipality_translation_municipality_uuid_language_key" UNIQUE ("municipality_uuid","language") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table grading
-- ----------------------------
ALTER TABLE "public"."grading" ADD PRIMARY KEY ("name") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table route_waymark_type
-- ----------------------------
ALTER TABLE "public"."route_waymark_type" ADD PRIMARY KEY ("name") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table poi_to_poi_type
-- ----------------------------
ALTER TABLE "public"."poi_to_poi_type" ADD PRIMARY KEY ("poi_type", "poi_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table poi_to_poi_type
-- ----------------------------
ALTER TABLE "public"."poi_to_poi_type" ADD CONSTRAINT "poi_to_poi_type_sort_index_key" UNIQUE ("sort_index") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table poi
-- ----------------------------
ALTER TABLE "public"."poi" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table poi
-- ----------------------------
ALTER TABLE "public"."poi" ADD CONSTRAINT "poi_id_legacy_ntb_key" UNIQUE ("id_legacy_ntb") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table document_status
-- ----------------------------
ALTER TABLE "public"."document_status" ADD PRIMARY KEY ("name") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table route_to_county
-- ----------------------------
ALTER TABLE "public"."route_to_county" ADD PRIMARY KEY ("route_uuid", "county_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table poi_link
-- ----------------------------
ALTER TABLE "public"."poi_link" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table poi_link
-- ----------------------------
ALTER TABLE "public"."poi_link" ADD CONSTRAINT "poi_link_poi_uuid_sort_index_key" UNIQUE ("poi_uuid","sort_index") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table trip_link
-- ----------------------------
ALTER TABLE "public"."trip_link" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table trip_link
-- ----------------------------
ALTER TABLE "public"."trip_link" ADD CONSTRAINT "trip_link_trip_uuid_sort_index_key" UNIQUE ("trip_uuid","sort_index") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table route_to_group
-- ----------------------------
ALTER TABLE "public"."route_to_group" ADD PRIMARY KEY ("route_uuid", "group_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table picture
-- ----------------------------
ALTER TABLE "public"."picture" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table picture
-- ----------------------------
ALTER TABLE "public"."picture" ADD CONSTRAINT "picture_id_legacy_ntb_key" UNIQUE ("id_legacy_ntb") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table poi_to_area
-- ----------------------------
ALTER TABLE "public"."poi_to_area" ADD PRIMARY KEY ("poi_uuid", "area_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table trip_to_poi
-- ----------------------------
ALTER TABLE "public"."trip_to_poi" ADD PRIMARY KEY ("trip_uuid", "poi_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table route_to_route_waymark_type
-- ----------------------------
ALTER TABLE "public"."route_to_route_waymark_type" ADD PRIMARY KEY ("route_waymark_type_name", "route_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table route_link
-- ----------------------------
ALTER TABLE "public"."route_link" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table route_link
-- ----------------------------
ALTER TABLE "public"."route_link" ADD CONSTRAINT "route_link_route_uuid_sort_index_key" UNIQUE ("route_uuid","sort_index") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table route
-- ----------------------------
ALTER TABLE "public"."route" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table route
-- ----------------------------
ALTER TABLE "public"."route" ADD CONSTRAINT "route_code_key" UNIQUE ("code") NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."route" ADD CONSTRAINT "route_id_legacy_ntb_ba_key" UNIQUE ("id_legacy_ntb_ba") NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."route" ADD CONSTRAINT "route_id_legacy_ntb_ab_key" UNIQUE ("id_legacy_ntb_ab") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table poi_accessability
-- ----------------------------
ALTER TABLE "public"."poi_accessability" ADD PRIMARY KEY ("accessability_name", "poi_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table poi_to_group
-- ----------------------------
ALTER TABLE "public"."poi_to_group" ADD PRIMARY KEY ("poi_uuid", "group_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table trip_to_activity_type
-- ----------------------------
ALTER TABLE "public"."trip_to_activity_type" ADD PRIMARY KEY ("activity_type_name", "trip_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table route_to_activity_type
-- ----------------------------
ALTER TABLE "public"."route_to_activity_type" ADD PRIMARY KEY ("activity_type_name", "route_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table uuid
-- ----------------------------
ALTER TABLE "public"."uuid" ADD PRIMARY KEY ("uuid", "document_type") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table route_to_poi
-- ----------------------------
ALTER TABLE "public"."route_to_poi" ADD PRIMARY KEY ("route_uuid", "poi_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table search_config
-- ----------------------------
ALTER TABLE "public"."search_config" ADD PRIMARY KEY ("name") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table tag
-- ----------------------------
ALTER TABLE "public"."tag" ADD PRIMARY KEY ("name_lower_case") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table county
-- ----------------------------
ALTER TABLE "public"."county" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table search_document
-- ----------------------------
ALTER TABLE "public"."search_document" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table search_document
-- ----------------------------
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_municipality_uuid_key" UNIQUE ("municipality_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_county_uuid_key" UNIQUE ("county_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_list_uuid_key" UNIQUE ("list_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_route_uuid_key" UNIQUE ("route_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_trip_uuid_key" UNIQUE ("trip_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_poi_uuid_key" UNIQUE ("poi_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_cabin_uuid_key" UNIQUE ("cabin_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_group_uuid_key" UNIQUE ("group_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_area_uuid_key" UNIQUE ("area_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table trip_to_group
-- ----------------------------
ALTER TABLE "public"."trip_to_group" ADD PRIMARY KEY ("trip_uuid", "group_uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Primary key structure for table trip
-- ----------------------------
ALTER TABLE "public"."trip" ADD PRIMARY KEY ("uuid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Uniques structure for table trip
-- ----------------------------
ALTER TABLE "public"."trip" ADD CONSTRAINT "trip_id_legacy_ntb_key" UNIQUE ("id_legacy_ntb") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table activity_type_to_activity_type
-- ----------------------------
ALTER TABLE "public"."activity_type_to_activity_type" ADD CONSTRAINT "activity_type_to_activity_type_sub_type_fkey" FOREIGN KEY ("sub_type") REFERENCES "public"."activity_type" ("name") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."activity_type_to_activity_type" ADD CONSTRAINT "activity_type_to_activity_type_primary_type_fkey" FOREIGN KEY ("primary_type") REFERENCES "public"."activity_type" ("name") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table area_to_county
-- ----------------------------
ALTER TABLE "public"."area_to_county" ADD CONSTRAINT "area_to_county_county_uuid_fkey" FOREIGN KEY ("county_uuid") REFERENCES "public"."county" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."area_to_county" ADD CONSTRAINT "area_to_county_area_uuid_fkey" FOREIGN KEY ("area_uuid") REFERENCES "public"."area" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table area_to_area
-- ----------------------------
ALTER TABLE "public"."area_to_area" ADD CONSTRAINT "area_to_area_child_uuid_fkey" FOREIGN KEY ("child_uuid") REFERENCES "public"."area" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."area_to_area" ADD CONSTRAINT "area_to_area_parent_uuid_fkey" FOREIGN KEY ("parent_uuid") REFERENCES "public"."area" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table area_to_municipality
-- ----------------------------
ALTER TABLE "public"."area_to_municipality" ADD CONSTRAINT "area_to_municipality_municipality_uuid_fkey" FOREIGN KEY ("municipality_uuid") REFERENCES "public"."municipality" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."area_to_municipality" ADD CONSTRAINT "area_to_municipality_area_uuid_fkey" FOREIGN KEY ("area_uuid") REFERENCES "public"."area" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table area
-- ----------------------------
ALTER TABLE "public"."area" ADD CONSTRAINT "area_status_fkey" FOREIGN KEY ("status") REFERENCES "public"."document_status" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table group_type
-- ----------------------------
ALTER TABLE "public"."group_type" ADD CONSTRAINT "group_type_parent_fkey" FOREIGN KEY ("parent") REFERENCES "public"."group_type" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table county_translation
-- ----------------------------
ALTER TABLE "public"."county_translation" ADD CONSTRAINT "county_translation_county_uuid_fkey" FOREIGN KEY ("county_uuid") REFERENCES "public"."county" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table cabin_accessability
-- ----------------------------
ALTER TABLE "public"."cabin_accessability" ADD CONSTRAINT "cabin_accessability_cabin_uuid_fkey" FOREIGN KEY ("cabin_uuid") REFERENCES "public"."cabin" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."cabin_accessability" ADD CONSTRAINT "cabin_accessability_accessability_name_fkey" FOREIGN KEY ("accessability_name") REFERENCES "public"."accessability" ("name") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table municipality
-- ----------------------------
ALTER TABLE "public"."municipality" ADD CONSTRAINT "municipality_county_uuid_fkey" FOREIGN KEY ("county_uuid") REFERENCES "public"."county" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."municipality" ADD CONSTRAINT "municipality_status_fkey" FOREIGN KEY ("status") REFERENCES "public"."document_status" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table cabin_link
-- ----------------------------
ALTER TABLE "public"."cabin_link" ADD CONSTRAINT "cabin_link_cabin_uuid_fkey" FOREIGN KEY ("cabin_uuid") REFERENCES "public"."cabin" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table group
-- ----------------------------
ALTER TABLE "public"."group" ADD CONSTRAINT "group_municipality_uuid_fkey" FOREIGN KEY ("municipality_uuid") REFERENCES "public"."municipality" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."group" ADD CONSTRAINT "group_status_fkey" FOREIGN KEY ("status") REFERENCES "public"."document_status" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."group" ADD CONSTRAINT "group_group_sub_type_fkey" FOREIGN KEY ("group_sub_type") REFERENCES "public"."group_type" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."group" ADD CONSTRAINT "group_group_type_fkey" FOREIGN KEY ("group_type") REFERENCES "public"."group_type" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table list_to_municipality
-- ----------------------------
ALTER TABLE "public"."list_to_municipality" ADD CONSTRAINT "list_to_municipality_municipality_uuid_fkey" FOREIGN KEY ("municipality_uuid") REFERENCES "public"."municipality" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."list_to_municipality" ADD CONSTRAINT "list_to_municipality_list_uuid_fkey" FOREIGN KEY ("list_uuid") REFERENCES "public"."list" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table group_link
-- ----------------------------
ALTER TABLE "public"."group_link" ADD CONSTRAINT "group_link_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "public"."group" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table cabin_opening_hours
-- ----------------------------
ALTER TABLE "public"."cabin_opening_hours" ADD CONSTRAINT "cabin_opening_hours_key_fkey" FOREIGN KEY ("key") REFERENCES "public"."cabin_opening_hours_key_type" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."cabin_opening_hours" ADD CONSTRAINT "cabin_opening_hours_service_level_fkey" FOREIGN KEY ("service_level") REFERENCES "public"."cabin_service_level" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."cabin_opening_hours" ADD CONSTRAINT "cabin_opening_hours_cabin_uuid_fkey" FOREIGN KEY ("cabin_uuid") REFERENCES "public"."cabin" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table list_to_group
-- ----------------------------
ALTER TABLE "public"."list_to_group" ADD CONSTRAINT "list_to_group_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "public"."group" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."list_to_group" ADD CONSTRAINT "list_to_group_list_uuid_fkey" FOREIGN KEY ("list_uuid") REFERENCES "public"."list" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table list_link
-- ----------------------------
ALTER TABLE "public"."list_link" ADD CONSTRAINT "list_link_list_uuid_fkey" FOREIGN KEY ("list_uuid") REFERENCES "public"."list" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table cabin_translation
-- ----------------------------
ALTER TABLE "public"."cabin_translation" ADD CONSTRAINT "cabin_translation_cabin_uuid_fkey" FOREIGN KEY ("cabin_uuid") REFERENCES "public"."cabin" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table cabin_facility
-- ----------------------------
ALTER TABLE "public"."cabin_facility" ADD CONSTRAINT "cabin_facility_cabin_uuid_fkey" FOREIGN KEY ("cabin_uuid") REFERENCES "public"."cabin" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."cabin_facility" ADD CONSTRAINT "cabin_facility_facility_name_fkey" FOREIGN KEY ("facility_name") REFERENCES "public"."facility" ("name") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table cabin
-- ----------------------------
ALTER TABLE "public"."cabin" ADD CONSTRAINT "cabin_status_fkey" FOREIGN KEY ("status") REFERENCES "public"."document_status" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."cabin" ADD CONSTRAINT "cabin_service_level_fkey" FOREIGN KEY ("service_level") REFERENCES "public"."cabin_service_level" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."cabin" ADD CONSTRAINT "cabin_municipality_uuid_fkey" FOREIGN KEY ("municipality_uuid") REFERENCES "public"."municipality" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."cabin" ADD CONSTRAINT "cabin_county_uuid_fkey" FOREIGN KEY ("county_uuid") REFERENCES "public"."county" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."cabin" ADD CONSTRAINT "cabin_contact_group_uuid_fkey" FOREIGN KEY ("contact_group_uuid") REFERENCES "public"."group" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."cabin" ADD CONSTRAINT "cabin_owner_group_uuid_fkey" FOREIGN KEY ("owner_group_uuid") REFERENCES "public"."group" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."cabin" ADD CONSTRAINT "cabin_maintainer_group_uuid_fkey" FOREIGN KEY ("maintainer_group_uuid") REFERENCES "public"."group" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table list_to_county
-- ----------------------------
ALTER TABLE "public"."list_to_county" ADD CONSTRAINT "list_to_county_county_uuid_fkey" FOREIGN KEY ("county_uuid") REFERENCES "public"."county" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."list_to_county" ADD CONSTRAINT "list_to_county_list_uuid_fkey" FOREIGN KEY ("list_uuid") REFERENCES "public"."list" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table cabin_to_area
-- ----------------------------
ALTER TABLE "public"."cabin_to_area" ADD CONSTRAINT "cabin_to_area_area_uuid_fkey" FOREIGN KEY ("area_uuid") REFERENCES "public"."area" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."cabin_to_area" ADD CONSTRAINT "cabin_to_area_cabin_uuid_fkey" FOREIGN KEY ("cabin_uuid") REFERENCES "public"."cabin" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table list
-- ----------------------------
ALTER TABLE "public"."list" ADD CONSTRAINT "list_status_fkey" FOREIGN KEY ("status") REFERENCES "public"."document_status" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."list" ADD CONSTRAINT "list_list_type_fkey" FOREIGN KEY ("list_type") REFERENCES "public"."list_type" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table municipality_translation
-- ----------------------------
ALTER TABLE "public"."municipality_translation" ADD CONSTRAINT "municipality_translation_municipality_uuid_fkey" FOREIGN KEY ("municipality_uuid") REFERENCES "public"."municipality" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table poi_to_poi_type
-- ----------------------------
ALTER TABLE "public"."poi_to_poi_type" ADD CONSTRAINT "poi_to_poi_type_poi_uuid_fkey" FOREIGN KEY ("poi_uuid") REFERENCES "public"."poi" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."poi_to_poi_type" ADD CONSTRAINT "poi_to_poi_type_poi_type_fkey" FOREIGN KEY ("poi_type") REFERENCES "public"."poi_type" ("name") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table poi
-- ----------------------------
ALTER TABLE "public"."poi" ADD CONSTRAINT "poi_status_fkey" FOREIGN KEY ("status") REFERENCES "public"."document_status" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."poi" ADD CONSTRAINT "poi_municipality_uuid_fkey" FOREIGN KEY ("municipality_uuid") REFERENCES "public"."municipality" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."poi" ADD CONSTRAINT "poi_county_uuid_fkey" FOREIGN KEY ("county_uuid") REFERENCES "public"."county" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."poi" ADD CONSTRAINT "poi_type_fkey" FOREIGN KEY ("type") REFERENCES "public"."poi_type" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table route_to_county
-- ----------------------------
ALTER TABLE "public"."route_to_county" ADD CONSTRAINT "route_to_county_county_uuid_fkey" FOREIGN KEY ("county_uuid") REFERENCES "public"."county" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."route_to_county" ADD CONSTRAINT "route_to_county_route_uuid_fkey" FOREIGN KEY ("route_uuid") REFERENCES "public"."route" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table poi_link
-- ----------------------------
ALTER TABLE "public"."poi_link" ADD CONSTRAINT "poi_link_poi_uuid_fkey" FOREIGN KEY ("poi_uuid") REFERENCES "public"."poi" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table trip_link
-- ----------------------------
ALTER TABLE "public"."trip_link" ADD CONSTRAINT "trip_link_trip_uuid_fkey" FOREIGN KEY ("trip_uuid") REFERENCES "public"."trip" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table route_to_group
-- ----------------------------
ALTER TABLE "public"."route_to_group" ADD CONSTRAINT "route_to_group_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "public"."group" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."route_to_group" ADD CONSTRAINT "route_to_group_route_uuid_fkey" FOREIGN KEY ("route_uuid") REFERENCES "public"."route" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table picture
-- ----------------------------
ALTER TABLE "public"."picture" ADD CONSTRAINT "picture_status_fkey" FOREIGN KEY ("status") REFERENCES "public"."document_status" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."picture" ADD CONSTRAINT "picture_cabin_picture_type_fkey" FOREIGN KEY ("cabin_picture_type") REFERENCES "public"."cabin_picture_type" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."picture" ADD CONSTRAINT "picture_trip_uuid_fkey" FOREIGN KEY ("trip_uuid") REFERENCES "public"."trip" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."picture" ADD CONSTRAINT "picture_route_uuid_fkey" FOREIGN KEY ("route_uuid") REFERENCES "public"."route" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."picture" ADD CONSTRAINT "picture_poi_uuid_fkey" FOREIGN KEY ("poi_uuid") REFERENCES "public"."poi" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."picture" ADD CONSTRAINT "picture_list_uuid_fkey" FOREIGN KEY ("list_uuid") REFERENCES "public"."list" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."picture" ADD CONSTRAINT "picture_cabin_uuid_fkey" FOREIGN KEY ("cabin_uuid") REFERENCES "public"."cabin" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."picture" ADD CONSTRAINT "picture_area_uuid_fkey" FOREIGN KEY ("area_uuid") REFERENCES "public"."area" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table poi_to_area
-- ----------------------------
ALTER TABLE "public"."poi_to_area" ADD CONSTRAINT "poi_to_area_area_uuid_fkey" FOREIGN KEY ("area_uuid") REFERENCES "public"."area" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."poi_to_area" ADD CONSTRAINT "poi_to_area_poi_uuid_fkey" FOREIGN KEY ("poi_uuid") REFERENCES "public"."poi" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table trip_to_poi
-- ----------------------------
ALTER TABLE "public"."trip_to_poi" ADD CONSTRAINT "trip_to_poi_poi_uuid_fkey" FOREIGN KEY ("poi_uuid") REFERENCES "public"."poi" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."trip_to_poi" ADD CONSTRAINT "trip_to_poi_trip_uuid_fkey" FOREIGN KEY ("trip_uuid") REFERENCES "public"."trip" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table route_to_route_waymark_type
-- ----------------------------
ALTER TABLE "public"."route_to_route_waymark_type" ADD CONSTRAINT "route_to_route_waymark_type_route_uuid_fkey" FOREIGN KEY ("route_uuid") REFERENCES "public"."route" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."route_to_route_waymark_type" ADD CONSTRAINT "route_to_route_waymark_type_route_waymark_type_name_fkey" FOREIGN KEY ("route_waymark_type_name") REFERENCES "public"."route_waymark_type" ("name") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table route_link
-- ----------------------------
ALTER TABLE "public"."route_link" ADD CONSTRAINT "route_link_route_uuid_fkey" FOREIGN KEY ("route_uuid") REFERENCES "public"."route" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table route
-- ----------------------------
ALTER TABLE "public"."route" ADD CONSTRAINT "route_status_fkey" FOREIGN KEY ("status") REFERENCES "public"."document_status" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."route" ADD CONSTRAINT "route_grading_fkey" FOREIGN KEY ("grading") REFERENCES "public"."grading" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table poi_accessability
-- ----------------------------
ALTER TABLE "public"."poi_accessability" ADD CONSTRAINT "poi_accessability_poi_uuid_fkey" FOREIGN KEY ("poi_uuid") REFERENCES "public"."poi" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."poi_accessability" ADD CONSTRAINT "poi_accessability_accessability_name_fkey" FOREIGN KEY ("accessability_name") REFERENCES "public"."accessability" ("name") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table poi_to_group
-- ----------------------------
ALTER TABLE "public"."poi_to_group" ADD CONSTRAINT "poi_to_group_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "public"."group" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."poi_to_group" ADD CONSTRAINT "poi_to_group_poi_uuid_fkey" FOREIGN KEY ("poi_uuid") REFERENCES "public"."poi" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table trip_to_activity_type
-- ----------------------------
ALTER TABLE "public"."trip_to_activity_type" ADD CONSTRAINT "trip_to_activity_type_trip_uuid_fkey" FOREIGN KEY ("trip_uuid") REFERENCES "public"."trip" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."trip_to_activity_type" ADD CONSTRAINT "trip_to_activity_type_activity_type_name_fkey" FOREIGN KEY ("activity_type_name") REFERENCES "public"."activity_type" ("name") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table route_to_activity_type
-- ----------------------------
ALTER TABLE "public"."route_to_activity_type" ADD CONSTRAINT "route_to_activity_type_route_uuid_fkey" FOREIGN KEY ("route_uuid") REFERENCES "public"."route" ("uuid") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."route_to_activity_type" ADD CONSTRAINT "route_to_activity_type_activity_type_name_fkey" FOREIGN KEY ("activity_type_name") REFERENCES "public"."activity_type" ("name") ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table route_to_poi
-- ----------------------------
ALTER TABLE "public"."route_to_poi" ADD CONSTRAINT "route_to_poi_poi_uuid_fkey" FOREIGN KEY ("poi_uuid") REFERENCES "public"."poi" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."route_to_poi" ADD CONSTRAINT "route_to_poi_route_uuid_fkey" FOREIGN KEY ("route_uuid") REFERENCES "public"."route" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table county
-- ----------------------------
ALTER TABLE "public"."county" ADD CONSTRAINT "county_status_fkey" FOREIGN KEY ("status") REFERENCES "public"."document_status" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table search_document
-- ----------------------------
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_municipality_uuid_fkey" FOREIGN KEY ("municipality_uuid") REFERENCES "public"."municipality" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_county_uuid_fkey" FOREIGN KEY ("county_uuid") REFERENCES "public"."county" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_list_uuid_fkey" FOREIGN KEY ("list_uuid") REFERENCES "public"."list" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_route_uuid_fkey" FOREIGN KEY ("route_uuid") REFERENCES "public"."route" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_trip_uuid_fkey" FOREIGN KEY ("trip_uuid") REFERENCES "public"."trip" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_poi_uuid_fkey" FOREIGN KEY ("poi_uuid") REFERENCES "public"."poi" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_cabin_uuid_fkey" FOREIGN KEY ("cabin_uuid") REFERENCES "public"."cabin" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "public"."group" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."search_document" ADD CONSTRAINT "search_document_area_uuid_fkey" FOREIGN KEY ("area_uuid") REFERENCES "public"."area" ("uuid") ON UPDATE CASCADE ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table trip_to_group
-- ----------------------------
ALTER TABLE "public"."trip_to_group" ADD CONSTRAINT "trip_to_group_group_uuid_fkey" FOREIGN KEY ("group_uuid") REFERENCES "public"."group" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."trip_to_group" ADD CONSTRAINT "trip_to_group_trip_uuid_fkey" FOREIGN KEY ("trip_uuid") REFERENCES "public"."trip" ("uuid") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

-- ----------------------------
--  Foreign keys structure for table trip
-- ----------------------------
ALTER TABLE "public"."trip" ADD CONSTRAINT "trip_status_fkey" FOREIGN KEY ("status") REFERENCES "public"."document_status" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."trip" ADD CONSTRAINT "trip_direction_fkey" FOREIGN KEY ("direction") REFERENCES "public"."trip_direction" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."trip" ADD CONSTRAINT "trip_grading_fkey" FOREIGN KEY ("grading") REFERENCES "public"."grading" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "public"."trip" ADD CONSTRAINT "trip_activity_type_fkey" FOREIGN KEY ("activity_type") REFERENCES "public"."activity_type" ("name") ON UPDATE CASCADE ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE;

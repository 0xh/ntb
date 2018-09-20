import KnextPostgis from 'knex-postgis';
import * as Knex from 'knex';


type ColumnName = string | Knex.Raw | Knex.QueryBuilder;


declare module 'knex-postgis' {
  interface KnexPostgisSetSrid {
    /**
     * Sets the SRID on the geometry (does not modify)
     */
    setSRID(geom: ColumnName, srid: number): Knex.QueryBuilder;
  }

  export interface KnexPostgis extends KnexPostgisSetSrid {}
}

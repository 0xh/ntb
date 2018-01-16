'use strict';


class Storage {
  constructor(session) {
    this.session = session;
  }

  logMigration(migrationName) {
    return this.executed()
      .then((migrations) => {
        migrations.push(migrationName);
        return this.session.run(
          'MATCH (m:MigrationDetails) SET m.migrations = $migrations',
          { migrations }
        );
      });
  }


  unlogMigration(migrationName) {
    return this.executed()
      .then((migrations) => (
        this.session.run(
          'MATCH (m:MigrationDetails) SET m.migrations = $migrations',
          {
            migrations: migrations.filter((m) => m !== migrationName),
          }
        )
      ));
  }


  executed() {
    const query = (
      'MERGE (m:MigrationDetails {key:"all"}) ' +
      'RETURN m.migrations AS migrations'
    );

    return this.session.run(query)
      .then((result) => (
        result.records.length
          ? result.records[0].get('migrations') || []
          : []
      ));
  }
}


module.exports = Storage;

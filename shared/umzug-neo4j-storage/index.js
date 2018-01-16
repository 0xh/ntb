'use strict';


class Storage {
  constructor(session) {
    this.session = session;
  }

  logMigration(migrationName) {
    console.log('*logMigration', migrationName, this.session);
    return Promise.resolve();
  }


  unlogMigration(migrationName) {
    console.log('*unlogMigration', migrationName, this.session);
    return Promise.resolve();
  }


  executed() {
    console.log('*executed', this.session);
    return Promise.resolve([]);
  }
}


module.exports = Storage;

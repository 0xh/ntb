'use strict';

const neo4j = require('neo4j-driver').v1;
const {
  NEO4J_URI,
  NEO4J_USER,
  NEO4J_PASSWORD,
} = require('@turistforeningen/ntb-shared-settings');


const createDriver = () =>
  neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(
      NEO4J_USER,
      NEO4J_PASSWORD
    )
  );


const createSession = (driver) => driver.session();


module.exports = {
  createDriver,
  createSession,
};

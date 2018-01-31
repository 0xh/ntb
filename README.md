NTB
===


# Get started

Temporarily set up to do development on your own host. Tested using Node 9.4.0.


Install all required npm-packages in all modules
```
lerna bootstrap
```

Remember to run migrations (see below).

----

# Migrations

Run migrations (located in `./migrations`)
```
node migrate.js up
```

----

# Cronjobs

## 01-harvest-counties-municipalities
Execute:
`node cronjobs/01-harvest-counties-municipalities/index.js`

Harvest counties and municipalities from Kartverket and update in Neo4j.

## 02-harvest-legacy-ntb
Execute:
`node cronjobs/01-harvest-counties-municipalities/index.js`

Harvest counties and municipalities from Kartverket and update in Neo4j.

----

# Deployment

## Secrets

`LEGACY_MONGO_DB_URI` - MongoDB-uri to the legacy NTB database
`LEGACY_MONGO_DB_NAME` - MongoDB-name to the legacy NTB database
`NEO4J_URI` - Bolt connection uri (example `bolt://localhost:7687`)
`NEO4J_USER` - Username for the Neo4j database
`NEO4J_PASSWORD` - Password for the Neo4j database

## Build

```
cp -a cronjobs/. build/cronjobs
cp -a migrations/. build/migrations
cp -a services/. build/services
cp -a shared/. build/shared
cp migrate.js build/migrate.js
cp package.json build/package.json
cp lerna.json build/lerna.json
cp yarn.lock build/yarn.lock
cp settings.json build/settings.json
cd build
lerna bootstrap
./node_modules/.bin/babel cronjobs --out-dir cronjobs
./node_modules/.bin/babel migrations --out-dir migrations
./node_modules/.bin/babel services --out-dir services
./node_modules/.bin/babel shared --out-dir shared
```

## Run migrations

`node migrate.js up`

## Start API service

`node services/api/index.js`

----

# Lerna

Uses Lerna and Yarn to handle cross dependencies between multiple internal modules. For instance, anything under `./shared/` can be «installed» as package dependencies in other modules. `shared/umzug-neo4j-storage/package.json` has a reference to `@turistforeningen/ntb-shared-neo4j-utils`

----

# npm packages

Uses yarn worspaces in conjunction with Lerna.

## Note on adding packages to root

In order to add packages to the root project, you need to ignore the yarn
workspace root check by adding the `-W` option. Example `yarn add -W eslint`.

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
`node cronjobs/02-harvest-legacy-ntb/index.js`

Harvest documents from legacy-ntb mongo database and convert them to the new
structure.

#### For testing: MondoDB documents locally
If you run `babel-node cronjobs/02-harvest-legacy-ntb/download-test-data.js`
all documents will be fetched from the mongodb and stored in `.json` files inside a `test-files` folder.

You can then run the cronjob with `testdata` parameter to use the files for fetching the documents.

`babel-node cronjobs/02-harvest-legacy-ntb/index.js testdata`

----

# Deployment

## Secrets

All secrets without defaults are **required**

`LEGACY_MONGO_DB_URI` - MongoDB-uri to the legacy NTB database

`LEGACY_MONGO_DB_NAME` - MongoDB-name to the legacy NTB database

**Postgres options**

`DB_HOST`: string

`DB_PORT`: string

`DB_USER`: string

`DB_PASSWORD`: string

`DB_NAME`: string - Database name

`DB_POOL_MIN`: number, default 0 - Minimum number of connection in pool

`DB_POOL_MAX`: number, default 5 - Maximum number of connection in pool

`DB_POOL_IDLE`: number, default 10000 - The maximum time, in milliseconds, that a connection can be idle before being released. Use with combination of evict for proper working.

`DB_POOL_ACQUIRE`: number, default 10000 - The maximum time, in milliseconds, that pool will try to get connection before throwing error

`DB_POOL_EVICT`: number, default 10000 - The time interval, in milliseconds, for evicting stale connections. Set it to 0 to disable this feature.


**Logging**

`DB_MIN_QUERY_TIME_FOR_LOGGING`: number, default 30 - Minimum SQL querytime before the query will be printed to logs.
- `0` eaquals NO will be logged
- `-1` equals all queries will be logged
- `<number>` ony queries taking longer then the given number of milliseconds will be logged


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

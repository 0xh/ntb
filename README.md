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

----

# Lerna

Uses Lerna and Yarn to handle cross dependencies between multiple internal modules. For instance, anything under `./shared/` can be «installed» as package dependencies in other modules. `shared/umzug-neo4j-storage/package.json` has a reference to `@turistforeningen/ntb-shared-neo4j-utils`

----

# npm packages

Uses yarn worspaces in conjunction with Lerna.

## Note on adding packages to root

In order to add packages to the root project, you need to ignore the yarn
workspace root check by adding the `-W` option. Example `yarn add -W eslint`.

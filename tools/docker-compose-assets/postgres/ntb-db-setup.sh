#!/bin/bash

echo "This script is using PGDATABASE ntb and OWNER ntb  ..."

echo "Checking if ntb exists ..."

# psql uses ENV vars for PGHOST, PGDATABASE, PGUSER and PGPASSWORD to connect to the target db.
if psql -lqt | cut -d \| -f 1 | grep -qw ntb; then
    # database exists. It is assumed that it exists with the right collation.
    echo "ntb exists ... normal exit."
    exit 0
else
    # create the DB with the right collation and postgis extension
    echo "creating DB ... "
    if psql postgres -c "create database \"ntb\" owner ntb encoding=\"UTF8\" LC_COLLATE=\"nb_NO.UTF8\" LC_CTYPE=\"nb_NO.UTF8\" template=template0;"; then
      echo "DB created successfully!"
      echo "installing postgis extension ..."
      if psql -d ntb -c "CREATE EXTENSION postgis;"; then
        echo "postgis extension installed successfully!"
        echo "installing other extensions ..."
        psql -d ntb -c "CREATE EXTENSION postgis_topology;"
        psql -d ntb -c "CREATE EXTENSION fuzzystrmatch;"
        psql -d ntb -c "CREATE EXTENSION postgis_tiger_geocoder;"
        psql -d ntb -c "CREATE EXTENSION \"uuid-ossp\";"
      else
        echo "ERROR: failed to install postgis extension. Aborting!"
        exit 1
      fi
      echo "DB ntb is now successfully created and setup."
    else
      echo "ERROR: failed to create ntb DB. Aborting!"
      exit 1
    fi
fi

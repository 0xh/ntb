#!/bin/bash
#  checking if ENV variables are set
if [ -z "$PGDATABASE" ] || [ -z "$PGUSER" ] || [ -z "$PGPASSWORD" ] || [ -z "$PGHOST" ]; then
  echo "ENV variables are not defined. Aborting!"
  exit 1;
else
  echo "This script is using PGDATABASE $PGDATABASE and OWNER $PGUSER  ..."

  echo "Checking if $PGDATABASE  exists ..."

  # psql uses ENV vars for PGHOST, PGDATABASE, PGUSER and PGPASSWORD to connect to the target db.
  if psql -lqt | cut -d \| -f 1 | grep -qw $PGDATABASE; then
      # database exists. It is assumed that it exists with the right collation.
      echo "$PGDATABASE exists ... normal exit."
      exit 0
  else
      # create the DB with the right collation and postgis extension
      echo "creating DB ... "
      if psql postgres -c "create database \"$PGDATABASE\" owner $PGUSER encoding=\"UTF8\" LC_COLLATE=\"nb_NO.UTF8\" LC_CTYPE=\"nb_NO.UTF8\" template=template0;"; then
        echo "DB created successfully!"
        echo "installing postgis extension ..."
        if psql -d $PGDATABASE -c "CREATE EXTENSION postgis;"; then
          echo "postgis extension installed successfully!"
          echo "installing other extensions ..."
          psql -d $PGDATABASE -c "CREATE EXTENSION postgis_topology;"
          psql -d $PGDATABASE -c "CREATE EXTENSION fuzzystrmatch;"
          psql -d $PGDATABASE -c "CREATE EXTENSION postgis_tiger_geocoder;"
          psql -d $PGDATABASE -c "CREATE EXTENSION \"uuid-ossp\";"
        else
          echo "ERROR: failed to install postgis extension. Aborting!"
          exit 1
        fi
        echo "DB $PGDATABASE is now successfully created and setup."
      else
        echo "ERROR: failed to create $PGDATABASE DB. Aborting!"
        exit 1
      fi
  fi
fi

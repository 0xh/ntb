#!/bin/sh
docker run --publish=5432:5432 --volume=$PWD/postgres/data:/var/lib/postgresql/data --name ntb-postgres -e POSTGRES_PASSWORD=ntb -e POSTGRES_USER=ntb -e POSTGRES_DB=ntb postgres

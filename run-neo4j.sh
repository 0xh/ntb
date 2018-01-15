#!/bin/sh
docker run --publish=7474:7474 --publish=7687:7687 --volume=$PWD/neo4j/data:/var/lib/neo4j/data neo4j

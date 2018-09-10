#!/bin/sh
echo "*Docs::server*"
echo "Init script: Making sure lerna is bootstrapped"
lerna bootstrap

echo "Init script: Booting up nodemon"
export TS_NODE_FILES=true
/build/node_modules/.bin/nodemon --inspect=0.0.0.0:9227 -e js,json,ts --watch /build/shared --watch /build/services/docs/server --watch /build/settings-dev.json --exec "node -r ts-node/register /build/services/docs/server/index.js"

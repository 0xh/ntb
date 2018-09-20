#!/bin/sh
echo "*API*"
echo "Init script: Making sure lerna is bootstrapped"
lerna bootstrap

echo "Init script: Booting up nodemon"
export TS_NODE_FILES=true
/build/node_modules/.bin/nodemon --inspect=0.0.0.0:9229 -e js,json,ts --watch /build/shared --watch /build/services/api --watch /build/settings-dev.json --exec "node -r ts-node/register /build/services/api/index.js"

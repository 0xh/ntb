#!/bin/sh
echo "*API*"
echo "Init script: Making sure lerna is bootstrapped"
lerna bootstrap

echo "Init script: Booting up nodemon"
/build/node_modules/.bin/nodemon --inspect=0.0.0.0:9229 -e js,json --watch /build/shared --watch /build/services/api --watch /build/settings-dev.json --exec "/build/node_modules/.bin/babel-node /build/services/api/index.js"

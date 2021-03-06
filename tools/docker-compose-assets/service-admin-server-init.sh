#!/bin/sh
echo "*Admin::server*"
echo "Init script: Making sure lerna is bootstrapped"
lerna bootstrap

echo "Init script: Booting up nodemon"
/build/node_modules/.bin/nodemon --inspect=0.0.0.0:9228 -e js,json --watch /build/shared --watch /build/services/admin/server --watch /build/settings-dev.json --exec "/build/node_modules/.bin/babel-node /build/services/admin/server/index.js"

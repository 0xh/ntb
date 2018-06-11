#!/bin/sh
echo "*Docs::client*"
echo "Init script: Making sure lerna is bootstrapped"
lerna bootstrap

echo "Init script: Booting up nodemon"
/build/node_modules/.bin/nodemon --watch services/docs/client/webpack.config.js --exec "/build/node_modules/.bin/webpack-dev-server --env.development --color --config services/docs/client/webpack.config.js"
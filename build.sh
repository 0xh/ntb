#!/bin/sh
echo "Cleaning build directory"
rm -rf build/
mkdir -p build/__compile

echo "Copying application files"
cp -R custom-typings build/__compile
cp -R cronjobs build/__compile
cp -R migrate build/__compile
cp -R services build/__compile
cp -R shared build/__compile

echo "Copying build configuration files"
cp tsconfig.json build/__compile
cp tslint.json build/__compile
cp package.json build/__compile
cp babel.config.js build/__compile
cp lerna.json build/__compile
cp yarn.lock build/__compile

echo "Bootstrapp using Lerna"
cd build/__compile && lerna bootstrap

echo "Building typescript"
./node_modules/.bin/tsc --outDir ../

echo "Moving node_modules"
cd .. && mv __compile/node_modules/ node_modules

echo "Removing __compile directory"
rm -rf __compile

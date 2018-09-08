#!/bin/sh
echo "Cleaning build directory"
rm -rf build/
mkdir build

echo "Copying application files"
cp -R custom-typings build/
cp -R shared build/
cp -R services build/

echo "Copying build configuration files"
cp tsconfig.json build/
cp tslint.json build/
cp package.json build/
cp lerna.json build/
cp yarn.lock build/

echo "Bootstrapp using Lerna"
cd build && lerna bootstrap

echo "Building typescript"
./node_modules/.bin/tsc --outDir .

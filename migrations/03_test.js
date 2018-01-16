'use strict';


const up = (query, DataTypes) => {
  return new Promise((resolve, reject) => {
    console.log('03_test UP');
    resolve();
  });
};


const down = (query, DataTypes) => {
  return new Promise((resolve, reject) => {
    console.log('03_test DOWN');
    resolve();
  });
};


module.exports = { up, down };

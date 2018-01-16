'use strict';


const up = (query, DataTypes) => {
  return new Promise((resolve, reject) => {
    console.log('02_tull UP');
    resolve();
  });
};


const down = (query, DataTypes) => {
  return new Promise((resolve, reject) => {
    console.log('02_tull DOWN');
    resolve();
  });
};


module.exports = { up, down };

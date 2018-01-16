'use strict';


const up = (query, DataTypes) => {
  return new Promise((resolve, reject) => {
    console.log('01_initial UP');
    resolve();
  });
};


const down = (query, DataTypes) => {
  return new Promise((resolve, reject) => {
    console.log('01_initial DOWN');
    resolve();
  });
};


module.exports = { up, down };

'use strict';

const CM = require('../../../shared-lib/countiesMunicipalities');
const statusMapper = require('../lib/statusMapper');


// TODO(Roar):
// - bilder
// - geojson


const mapping = (obj) => {
  const res = {};

  res.area = {
    id_legacy_ntb: obj._id,
    name: obj.navn,
    description: obj.beskrivelse,
    map: obj.kart,

    url: 'string',
    license: obj.lisens,

    provider: obj.tilbyder,
    status: statusMapper(obj.status),
    last_modified: obj.endret,
  };

  // Counties
  res.counties = {};
  if (obj.fylker) {
    obj.fylker.forEach((f) => {
      const match = CM.findByName('county', f);
      if (match && match.count === 1) {
        const county = match.data[0];
        if (!res.counties[county.uuid]) {
          res.counties[county.uuid] = county;
        }
        else {
          console.log(
            `area :: ${obj._id} :: duplicate instance of county found [${f}]`
          );
        }
      }
      else if (!match) {
        console.log(
          `area :: ${obj._id} :: unable to identify county [${f}]`
        );
      }
      else {
        console.log(
          `area :: ${obj._id} :: multiple counties found on the same ` +
          `name [${f}]`
        );
      }
    });
  }

  // Municipalities
  res.municipalities = {};
  if (obj.kommuner) {
    obj.kommuner.forEach((f) => {
      const match = CM.findByName('municipality', f);
      if (match && match.count === 1) {
        const county = match.data[0];
        if (!res.municipalities[county.uuid]) {
          res.municipalities[county.uuid] = county;
        }
        else {
          console.log(
            `area :: ${obj._id} :: duplicate instance of ` +
            `municipality found [${f}]`
          );
        }
      }
      else if (!match) {
        console.log(
          `area :: ${obj._id} :: unable to identify municipality [${f}]`
        );
      }
      else {
        console.log(
          `area :: ${obj._id} :: multiple municipalities found on the ` +
          `same name [${f}]`
        );
      }
    });
  }

  res.areaRelations = obj.foreldreområder || [];

  return res;
};


module.exports = {
  mapping,
  structure: {
    _id: 'string',

    foreldreområder: 'array-strings', // :LOCATED_IN-relationship

    navn: 'string',
    beskrivelse: 'string',
    tilbyder: 'string',
    url: 'string',
    kart: 'string',
    geojson: 'geojson',

    status: 'string',

    bilder: 'array-strings',

    fylker: 'array-strings',
    kommuner: 'array-strings',

    checksum: 'string', // Not sure we need this one, but we need to handle the same functionality some how
    endret: 'date',

    lisens: 'string',
    navngiving: 'string', // Suggest contructing this in the output rather then storing it in the DB

    privat: {
      sherpa2_code: 'string',
      gammel_url: 'string',
      sherpa2_id: 'number',
    },
  },
};

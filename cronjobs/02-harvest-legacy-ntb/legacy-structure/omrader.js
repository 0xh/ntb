'use strict';

const statusMapper = require('../lib/statusMapper');


// TODO(Roar):
// - bilder
// - geojson


const mapCounties = (obj, res, handler) => {
  res.counties = [];
  if (obj.fylker) {
    res.counties = obj.fylker
      .map((f) => {
        const match = handler.counties
          .filter((c) => c.name.toLowerCase() === f.trim().toLowerCase());
        if (match.length === 1) {
          return match[0].uuid;
        }
        return null;
      })
      .filter((c) => c !== null);
  }
};


const mapMunicipalities = (obj, res, handler) => {
  res.municipalities = [];
  if (obj.kommuner) {
    res.municipalities = obj.kommuner
      .map((f) => {
        const match = handler.municipalities
          .filter((c) => c.name.toLowerCase() === f.trim());
        if (match.length === 1) {
          return match[0].uuid;
        }
        else if (match.length > 1) {
          console.log(
            '  - ERR: Found multiple municipalities for name ' +
            `"${f} - area.id_legacy_ntb=${obj._id}`
          );
        }
        return null;
      })
      .filter((c) => c !== null);
  }
};


const mapping = (obj, handler) => {
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

  mapCounties(obj, res, handler);
  mapMunicipalities(obj, res, handler);

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

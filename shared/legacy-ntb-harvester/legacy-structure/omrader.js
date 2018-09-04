import uuid4 from 'uuid/v4';

import {
  sanitizeHtml,
  stripHtml,
} from '@ntb/shared-text-content-utils';

import statusMapper from '../lib/statusMapper';


async function mapping(obj, handler) {
  const res = {};

  res.area = {
    id: uuid4(),
    idLegacyNtb: obj._id,
    name: obj.navn,
    nameLowerCase: obj.navn.toLowerCase(),

    description: obj.beskrivelse ? sanitizeHtml(obj.beskrivelse) : null,
    descriptionPlain: obj.beskrivelse ? stripHtml(obj.beskrivelse) : null,

    geometry: obj.geojson,

    map: obj.kart,
    url: obj.url,
    license: obj.lisens,

    provider: obj.tilbyder,
    status: statusMapper(obj.status),
    updatedAt: obj.endret,

    dataSource: 'legacy-ntb',
  };

  res.areaRelations = obj.foreldreområder || [];

  res.pictures = obj.bilder || [];

  return res;
}


export default {
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

    // Not sure we need this one, but we need to handle the same functionality
    // some how
    checksum: 'string',
    endret: 'date',

    lisens: 'string',
    // Suggest contructing this in the output rather then storing it in the DB
    navngiving: 'string',

    privat: {
      sherpa2_code: 'string',
      gammel_url: 'string',
      sherpa2_id: 'number',
    },
  },
};

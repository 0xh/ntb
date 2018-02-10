import uuid4 from 'uuid/v4';

import statusMapper from '../lib/statusMapper';

import { cleanWord, stemAll } from '@turistforeningen/ntb-shared-hunspell';


// TODO(Roar):
// - bilder
// - geojson


function mapCounties(obj, res, handler) {
  res.counties = [];
  if (obj.fylker) {
    res.counties = obj.fylker
      .map((f) => {
        const match = handler.counties
          .filter((c) => c.nameLowerCase === f.trim().toLowerCase());
        if (match.length === 1) {
          return match[0].uuid;
        }
        return null;
      })
      .filter((c) => c !== null);
  }
}


function mapMunicipalities(obj, res, handler) {
  res.municipalities = [];
  if (obj.kommuner) {
    res.municipalities = obj.kommuner
      .map((f) => {
        const match = handler.municipalities
          .filter((c) => c.nameLowerCase === f.trim());
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
}


async function mapping(obj, handler) {
  const res = {};
  const description = {};

  if (obj.beskrivelse) {
    description.original = obj.beskrivelse.trim();
    description.plain = description.original
      .replace(/<{1}[^<>]{1,}>{1}/g, ' ') // replace html-tags
      .replace(/\u00a0/g, ' ') // replace nbsp-character
      .trim();
    description.words = Array.from(new Set(
      description.plain
        .split(' ')
        .map((w) => cleanWord(w.toLowerCase()))
        .filter((w) => w)
    ));
    description.stemmed = await stemAll('nb', description.words);
  }

  res.area = {
    uuid: uuid4(),
    idLegacyNtb: obj._id,
    name: obj.navn,
    nameLowerCase: obj.navn.toLowerCase(),

    description: description.original || null,
    descriptionPlain: description.plain || null,
    descriptionWords: description.words || null,
    descriptionWordsStemmed: description.stemmed || null,

    map: obj.kart,
    url: obj.url,
    license: obj.lisens,

    provider: obj.tilbyder,
    status: statusMapper(obj.status),
    updatedAt: obj.endret,

    dataSource: 'legacy-ntb',
  };

  mapCounties(obj, res, handler);
  mapMunicipalities(obj, res, handler);

  res.areaRelations = obj.foreldreområder || [];

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

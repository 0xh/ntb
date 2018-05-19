import uuid4 from 'uuid/v4';

import statusMapper from '../lib/statusMapper';


async function mapping(obj, handler) {
  const res = {};

  if (!obj.fotograf) {
    obj.fotograf = {};
  }

  res.picture = {
    id: uuid4(),
    idLegacyNtb: obj._id,

    description: (obj.beskrivelse || '').trim(),

    photographerName: obj.fotograf.navn,
    photographerEmail: obj.fotograf.epost,
    photographerCredit: obj.fotograf.kreditering,

    coordinates: obj.geojson,

    original: obj.original,
    exif: obj.exif,
    versions: obj.img,

    legacyFirstTag: (obj.tags || []).length
      ? obj.tags[0].split(',')[0].toLowerCase().trim()
      : null,
    legacyTags: (obj.tags || []).length ? obj.tags : [],

    license: obj.lisens,

    provider: obj.tilbyder,
    status: statusMapper(obj.status),
    updatedAt: obj.endret,

    dataSource: 'legacy-ntb',
  };

  return res;
}


export default {
  mapping,
  structure: {
    _id: 'string',
    beskrivelse: 'string',
    fotograf: {
      navn: 'string',
      epost: 'string',
      kreditering: 'string',
    },
    navn: 'string',
    tilbyder: 'string',
    checksum: 'string',
    endret: 'string',
    lisens: 'string',
    navngiving: 'string',
    status: 'string',
    tags: 'array-strings',
    geojson: 'geojson',
    img: [
      {
        url: 'string',
        height: 'number',
        width: 'number',
        aspect: 'string',
        quality: 'number',
        etag: 'string',
      },
    ],
    original: {
      size: 'string',
      sha1: 'string',
      format: 'string',
      colorspace: 'string',
      height: 'number',
      width: 'number',
    },
    exif: {
      DateTimeDigitized: 'string',
      Make: 'string',
      Model: 'string',
      Software: 'string',
      Artist: 'string',
      Copyright: 'string',
      DateTime: 'string',
      ImageDescription: 'string',
      DocumentName: 'string',
    },
    privat: {
      sherpa2_id: 'number',
      opprettet_av: {
        id: 'ignore',
        navn: 'string',
        epost: 'string',
      },
      endret_av: {
        id: 'ignore',
        navn: 'string',
        epost: 'string',
      },
    },
  },
};

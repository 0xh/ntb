'use strict';

const mapping = () => {};


module.exports = {
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
    },
    privat: {
      sherpa2_id: 'number',
      opprettet_av: {
        id: 'string',
        navn: 'string',
        epost: 'string',
      },
      endret_av: {
        id: 'string',
        navn: 'string',
        epost: 'string',
      },
    },
  },
};

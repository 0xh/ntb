'use strict';

const AbstractModel = require('../lib/AbstractModel');


class Areas extends AbstractModel {
  // eslint-disable-next-line class-methods-use-this
  legacyType() {
    return 'bilder';
  }

  // eslint-disable-next-line class-methods-use-this
  label() {
    return 'Image';
  }

  // eslint-disable-next-line class-methods-use-this
  getLegacyStructure() {
    return {
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
    };
  }
}


module.exports = Areas;

'use strict'

const AbstractModel = require('../lib/AbstractModel')


class Areas extends AbstractModel {
  legacyType() {
    return 'bilder'
  }

  label() {
    return 'Image'
  }

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
        width: 'number'
      },
      exif: {
        DateTimeDigitized: 'string',
        Make: 'string',
        Model: 'string',
        Software: 'string',
      },
    }
  }
}


module.exports = Areas

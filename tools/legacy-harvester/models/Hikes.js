'use strict'

const AbstractModel = require('../lib/AbstractModel')


class Places extends AbstractModel {
  legacyType() {
    return 'turer'
  }

  label() {
    return 'Hike'
  }

  getLegacyStructure() {
    return {
      _id: 'string',
      checksum: 'string',
      områder: 'array-strings',
      lisens: 'string',
      geojson: 'geojson',
      distanse: 'number',
      fylker: 'array-strings',
      kommuner: 'array-strings',
      passer_for: 'array-strings',
      bilder: 'array-strings',
      tilrettelagt_for: 'array-strings',
      navn: 'string',
      beskrivelse: 'string',
      kollektiv: 'string',
      rute: {
        kode: 'string',
        type: 'string',
        merkinger: 'array-strings',
        kilde: 'string',
        merknader: 'string',
        kvisting: {},
      },
      tidsbruk: {
        normal: {
          dager: 'number',
          timer: 'number',
          minutter: 'number',
        },
        min: {
          dager: 'number',
          timer: 'number',
          minutter: 'number',
        },
        max: {
          dager: 'number',
          timer: 'number',
          minutter: 'number',
        }
      },
      tilkomst: {
        generell: 'string',
        kollektivtransport: 'string',
      },
      steder: 'array-strings',
      tags: 'array-strings',
      navngiving: 'string',
      status: 'string',
      adkomst: 'string',
      gradering: 'string',
      sesong: 'array-numbers',
      url: 'string',
      tilbyder: 'string',
      retning: 'string',
      endret: 'date',
      grupper: 'array-strings',
      lenker: [
        {
          type: 'string',
          url: 'string',
          tittel: 'string',
        },
      ],
    }
  }
}


module.exports = Places

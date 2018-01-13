'use strict';

const AbstractModel = require('../lib/AbstractModel');


class Areas extends AbstractModel {
  // eslint-disable-next-line class-methods-use-this
  legacyType() {
    return 'områder';
  }

  // eslint-disable-next-line class-methods-use-this
  label() {
    return 'Area';
  }

  // eslint-disable-next-line class-methods-use-this
  getLegacyStructure() {
    return {
      _id: 'string',
      checksum: 'string',
      endret: 'date',
      bilder: 'array-strings',
      kart: 'string',
      status: 'string',
      geojson: 'geojson',
      kommuner: 'array-strings',
      fylker: 'array-strings',
      lisens: 'string',
      navngiving: 'string',
      foreldreområder: 'array-strings',
      url: 'string',
      tilbyder: 'string',
      beskrivelse: 'string',
      navn: 'string',
      privat: {
        sherpa2_code: 'string',
        gammel_url: 'string',
        sherpa2_id: 'number',
      },
    };
  }
}


module.exports = Areas;

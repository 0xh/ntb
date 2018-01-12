'use strict'

const AbstractModel = require('../lib/AbstractModel')


class Areas extends AbstractModel {
  legacyType() {
    return 'grupper'
  }

  label() {
    return 'Group'
  }

  getLegacyStructure() {
    return {
      _id: 'string',
      tilbyder: 'string',
      status: 'string',
      grupper: 'array-strings',
      tags: 'array-strings',
      navngiving: 'string',
      logo: 'string',
      foreldregruppe: 'string',
      url: 'string',
      endret: 'date',
      navn: 'string',
      beskrivelse: 'string',
      checksum: 'string',
      lisens: 'string',
      organisasjonsnr: 'string',
      foreldregrupper: 'array-strings',
      privat: {},
      lenker: [
        {
          type: 'string',
          url: 'string',
        },
      ],
      kontaktinfo: [
        {
          type: 'string',
          epost: 'string',
          telefon: 'string',
          tittel: 'string',
          poststed: 'string',
          adresse1: 'string',
          postnummer: 101,
        }
      ]
    }
  }
}


module.exports = Areas

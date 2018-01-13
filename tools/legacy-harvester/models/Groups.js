'use strict';

const AbstractModel = require('../lib/AbstractModel');


class Areas extends AbstractModel {
  // eslint-disable-next-line class-methods-use-this
  legacyType() {
    return 'grupper';
  }

  // eslint-disable-next-line class-methods-use-this
  label() {
    return 'Group';
  }

  // eslint-disable-next-line class-methods-use-this
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
      privat: {
        sherpa2_id: 'number',
        endret_av: {
          epost: 'string',
          id: 'string',
          navn: 'string',
        },
        opprettet_av: {
          epost: 'string',
          id: 'string',
          navn: 'string',
        },
        brukere: [
          {
            pbkdf2: 'ignore',
            navn: 'string',
            epost: 'string',
          },
        ],
        invitasjoner: 'ignore',
      },
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
          fax: 'string',
          tittel: 'string',
          poststed: 'string',
          adresse1: 'string',
          adresse2: 'string',
          postnummer: 101,
        },
      ],
    };
  }
}


module.exports = Areas;

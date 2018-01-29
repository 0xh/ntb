'use strict';

const statusMapper = require('../lib/statusMapper');


const mapping = (obj, handler) => {
  const res = {};

  res.area = {
    id_legacy_ntb: obj._id,
    name: obj.navn,
    description: obj.beskrivelse,

    url: 'string',
    license: obj.lisens,

    provider: obj.tilbyder,
    status: statusMapper(obj.status),
    last_modified: obj.endret,
  };

  return res;
};


module.exports = {
  mapping,
  structure: {
    _id: 'string',

    navn: 'string',
    beskrivelse: 'string',

    lisens: 'string',
    url: 'string',

    tilbyder: 'string',
    status: 'string',
    endret: 'date',

    grupper: 'array-strings',
    tags: 'array-strings',
    navngiving: 'string',
    logo: 'string',
    foreldregruppe: 'string',
    checksum: 'string',
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
        email: 'string',
        id: 'string',
        navn: 'string',
        name: 'string',
      },
      registrert_av: {
        email: 'string',
        id: 'string',
        name: 'string',
      },
      brukere: [
        {
          id: 'string',
          pbkdf2: 'ignore',
          navn: 'string',
          name: 'string',
          epost: 'string',
          email: 'string',
          konvertert: 'boolean',
          konvertert_av: {
            id: 'string',
            navn: 'string',
            epost: 'string',
          },
        },
      ],
      invitasjoner: 'ignore',
    },
    lenker: [
      {
        type: 'string',
        url: 'string',
        tittel: 'string',
      },
    ],
    kontaktinfo: [
      {
        type: 'string',
        epost: 'string',
        telefon: 'string',
        mobil: 'string',
        fax: 'string',
        tittel: 'string',
        poststed: 'string',
        adresse1: 'string',
        adresse2: 'string',
        postnummer: 101,
      },
    ],
  },
};

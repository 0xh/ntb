'use strict';

const mapping = () => {};


module.exports = {
  mapping,
  structure: {
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

'use strict';

const mapping = () => {};


module.exports = {
  mapping,
  structure: {
    _id: 'string',
    err: 'string', // 'TripNotFound', 544abe3427c2e69800af3c8a
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
      kvisting: {
        helårs: 'boolean',
        fra: 'date',
        til: 'date',
        kommentar: 'string',
      },
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
      },
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
    privat: {
      hovedkategori: 'number',
      gammel_url: 'string',
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
      startpunkt: 'ignore', // geojson fails on some objects due to coordinates being string? 524081f9b8cb77df15000b8e
      minutter: 'number',
    },
  },
};

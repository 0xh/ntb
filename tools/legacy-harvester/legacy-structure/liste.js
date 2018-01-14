'use strict';


module.exports = {
  _id: 'string',
  lisens: 'string',
  navngiving: 'string',
  status: 'string',
  navn: 'string',
  beskrivelse: 'string',
  lenker: [
    {
      type: 'string',
      url: 'string',
      tittel: 'string',
    },
  ],
  tags: 'array-strings',
  geojson: 'geojson',
  grupper: 'array-strings',
  start: 'date',
  stopp: 'date',
  bilder: 'array-strings',
  steder: 'array-strings',
  kommuner: 'array-strings',
  fylker: 'array-strings',
  tilbyder: 'string',
  endret: 'date',
  checksum: 'string',
  privat: {
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
  },
};


async function mapping(obj, handler) {
  // todo
}


module.exports = {
  mapping,
  structure: {
    _id: 'string',
    checksum: 'string',
    navngiving: 'string',
    tags: 'array-strings',
    tilbyder: 'string',
    beskrivelse: 'string',
    geojson: 'geojson',
    endret: 'date',
    kommune: 'string',
    lisens: 'string',
    navn: 'string',
    status: 'string',
    fylke: 'string',
    områder: 'array-strings',
    grupper: 'array-strings',
    bilder: 'array-strings',
    tilrettelagt_for: 'array-strings',
    sesong: 'array-numbers',
    åpen: 'boolean',
    ssr_id: 'number',
    lenker: [
      {
        url: 'string',
        type: 'string',
        tittel: 'string',
      },
    ],
    privat: {
      endret_av: {
        epost: 'string',
        id: 'ignore',
        navn: 'string',
      },
      opprettet_av: {
        epost: 'string',
        id: 'ignore',
        navn: 'string',
      },
    },
  },
};

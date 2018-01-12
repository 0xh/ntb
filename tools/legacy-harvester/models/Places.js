'use strict'

const AbstractModel = require('../lib/AbstractModel')


class Places extends AbstractModel {
  legacyType() {
    return 'steder'
  }

  label() {
    return 'Place'
  }

  getLegacyStructure() {
    return {
      _id: 'string',
      checksum: 'string',
      navngiving: 'string',
      tags: 'array-strings',
      tilbyder: 'string',
      beskrivelse: 'string',
      description: 'string',
      geojson: 'geojson',
      endret: 'date',
      kommune: 'string',
      lisens: 'string',
      navn: 'string',
      navn_alt: 'array-strings',
      status: 'string',
      fylke: 'string',
      områder: 'array-strings',
      grupper: 'array-strings',
      bilder: 'array-strings',
      turkart: 'array-strings',
      betjeningsgrad: 'string',
      tilrettelagt_for: 'array-strings',
      åpen: 'boolean',
      kart: 'string',
      url: 'string',
      byggeår: 'number',
      ssr_id: 'number',
      senger: {
        ekstra: 'number',
        betjent: 'number',
        selvbetjent: 'number',
        ubetjent: 'number',
        vinter: 'number',
      },
      lenker: [
        {
          url: 'string',
          type: 'string',
          tittel: 'string',
        },
      ],
      tilkomst: {
        privat: {
          sommer: 'string',
          vinter: 'string',
        },
      },
      adkomst: {
        vinter: 'string',
        sommer: 'string',
      },
      fasiliteter: {
        Vedovn: 'string',
        Mobildekning: 'string',
        Tørkerom: 'string',
        Kortbetaling: 'string',
        Servering: 'string',
        Dusj: 'string',
        '220v': 'string',
        '12v': 'string',
        Strømovn: 'string',
        Wc: 'string',
        Peis: 'string',
        Telefon: 'string',
        Sykkelutleie: 'string',
        Utleie: 'string',
        Båt: 'string',
        Badstu: 'string',
        Kano: 'string',
        Teltplass: 'string',
        Vann: 'string',
        Steikeovn: 'string',
      },
      kontaktinfo: [
        {
          navn: 'string',
          epost: 'string',
          telefon: 'string',
          mobil: 'string',
          type: 'string',
          gruppe_id: 'string',
          adresse1: 'string',
          adresse2: 'string',
          postnummer: 'string',
          poststed: 'string',
          fax: 'string',
          kontaktperson: 'string',
        },
      ],
      tilrettelegginger: [
        {
          type: 'string',
          kommentar: 'string',
        },
      ],
    }
  }
}


module.exports = Places

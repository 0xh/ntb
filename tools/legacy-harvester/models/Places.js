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
      err: 'string',      // CABIN NOT FOUND 53a930f4a12751a2007eb6cf
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
          postnummer: 'number',
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
      steder: {
        endret_av: {
          epost: 'string',
          id: 'string',
          navn: 'string',
        },
        opprettet_av: {
          epost: 'string',
          id: 'number',
          navn: 'string',
        },
      },
      privat: {
        åpningstider: [
          {
            helårs: 'string',
            fra: 'date',
            til: 'date',
            betjeningsgrad: 'string',
            nøkkel: 'string',
            kommentar: 'string'
          }
        ],
        kontaktinfo: {
          sesong: {
            epost: 'string',
            postnummer: 'string',
            adresse: 'string',
            adresse1: 'string',
            adresse2: 'string',
            poststed: 'string',
            telefon: 'string',
            mobil: 'string',
            fax: 'string',
            type: 'string',
            gruppe_id: 'string',
            navn: 'string',
          },
          utenom_sesong: {
            epost: 'string',
            postnummer: 'string',
            adresse: 'string',
            adresse1: 'string',
            adresse2: 'string',
            poststed: 'string',
            telefon: 'string',
            mobil: 'string',
            fax: 'string',
            type: 'string',
            gruppe_id: 'string',
            navn: 'string',
          }
        },
        sherpa2_id: 'number',
        gammel_url: 'string',
        juridisk_eier: 'string',
        vedlikeholdes_av: 'string',
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
        hyttetype: 'number',
        hytteeier: 'string',
        senger: {
          vinter: 'number',
          ekstra: 'number',
          betjent: 'number',
          selvbetjent: 'number',
          ubetjent: 'number'
        }
      },
    }
  }
}


module.exports = Places

import uuid4 from 'uuid/v4';

import {
  sanitizeHtml,
  stripHtml,
} from '@turistforeningen/ntb-shared-text-content-utils';
import { createLogger } from '@turistforeningen/ntb-shared-utils';

import statusMapper from '../lib/statusMapper';


const logger = createLogger();


function mapType(type, obj) {
  switch (type) {
    case 'alpint':
      return 'alpine skiing';
    case 'bretur':
      return 'glacier';
    case 'bærtur':
      return 'berry-picking';
    case 'downhillsykling':
      return 'downhill biking';
    case 'fisketur':
      return 'fishing';
    case 'fjelltur':
    case 'fottur':
      return 'hiking';
    case 'grottetur':
      return 'grotto trip';
    case 'hyttetur':
      return 'cabin trip';
    case 'kajakk':
    case 'kajakktur':
      return 'kayaking';
    case 'kanotur':
    case 'kano':
      return 'canoeing';
    case 'klatring':
    case 'klatretur':
      return 'climbing';
    case 'landeveissykling':
      return 'road cycling';
    case 'langrenn':
      return 'cross country skiing';
    case 'padletur':
      return 'kayak';
    case 'skitur':
      return 'skiing';
    case 'skøytetur':
      return 'skating';
    case 'skogstur':
      return 'forest';
    case 'snowboard':
      return 'snowboard';
    case 'snøhuletur':
      return 'snow cave trip';
    case 'sopptur':
      return 'mushroom picking';
    case 'sykkeltur':
      return 'cycling';
    case 'telemark':
      return 'telemark skiing';
    case 'terrengsykling':
      return 'mountain biking';
    case 'telttur':
      return 'camping';
    case 'topptur':
      return 'summit';
    case 'trilletur':
      return 'strolling';
    default:
      logger.error(
        `Unknown trip type "${type}" on ` +
        `trip.id_legacy_ntb=${obj._id}`
      );
      return null;
  }
}


function setType(obj, res, handler) {
  const type = obj.tags && obj.tags.length ? obj.tags[0].toLowerCase() : null;
  res.trip.type = mapType(type.toLowerCase().trim(), obj);
}


function setAltTypes(obj, res, handler) {
  res.trip.altType = obj.tags && obj.tags.length > 0
    ? obj.tags.map((tag) => mapType(tag.toLowerCase().trim(), obj))
    : [mapType(null, obj)];

  res.trip.altType = Array.from(new Set(res.trip.altType));
}


function setLinks(obj, res, handler) {
  res.links = [];

  if (obj.lenker && obj.lenker.length) {
    obj.lenker.forEach((link, idx) => {
      if (link.url) {
        res.links.push({
          uuid: uuid4(),
          title: link.tittel,
          url: link.url,
          idTripLegacyNtb: obj._id,
          sortIndex: idx,
          dataSource: 'legacy-ntb',
        });
      }
    });
  }
}


function mapCounties(obj, res, handler) {
  res.counties = [];
  if (obj.fylker) {
    res.counties = obj.fylker
      .map((f) => {
        let cleanName = f.trim().toLowerCase();

        if (cleanName.endsWith('trøndelag')) {
          cleanName = 'trøndelag';
        }

        if (cleanName.startsWith('finnmark')) {
          cleanName = 'finnmark';
        }

        const match = handler.counties
          .filter((c) => c.nameLowerCase === cleanName.toLowerCase().trim());
        if (match.length === 1) {
          return match[0].uuid;
        }
        else if (match.length > 1) {
          logger.warn(
            'Found multiple counties for name ' +
            `"${cleanName}" - trip.id_legacy_ntb=${obj._id}`
          );
        }

        // logger.warn(
        //   'Unable to find a county for name ' +
        //   `"${cleanName}" - trip.id_legacy_ntb=${obj._id}`
        // );

        return null;
      })
      .filter((c) => c !== null);
  }
}


function mapMunicipalities(obj, res, handler) {
  res.municipalities = [];
  if (obj.kommuner) {
    res.municipalities = obj.kommuner
      .map((f) => {
        const cleanName = f.trim().toLowerCase();

        const match = handler.municipalities
          .filter((c) => c.nameLowerCase === cleanName);
        if (match.length === 1) {
          return match[0].uuid;
        }
        else if (match.length > 1) {
          logger.warn(
            'Found multiple municipalities for name ' +
            `"${cleanName}" - trip.id_legacy_ntb=${obj._id}`
          );
        }

        // logger.warn(
        //   'Unable to find a municipality for name ' +
        //   `"${cleanName}" - trip.id_legacy_ntb=${obj._id}`
        // );

        return null;
      })
      .filter((c) => c !== null);
  }
}


function mapGrading(obj) {
  if (!obj.gradering) {
    return null;
  }

  const cleanName = obj.gradering.toLowerCase().trim();
  switch (cleanName) {
    case 'enkel':
      return 'easy';
    case 'middels':
      return 'moderate';
    case 'krevende':
      return 'tough';
    case 'ekspert':
      return 'very tough';
    default:
      logger.error(
        'Unknown grading ' +
        `"${cleanName}" - trip.id_legacy_ntb=${obj._id}`
      );
      return 'moderate';
  }
}


function mapDirection(obj) {
  if (!obj.retning) {
    return null;
  }

  const cleanName = obj.retning.toLowerCase().trim();
  switch (cleanName) {
    case 'ab':
      return 'ab';
    case 'aba':
      return 'aba';
    default:
      logger.error(
        'Unknown direction ' +
        `"${cleanName}" - trip.id_legacy_ntb=${obj._id}`
      );
      return null;
  }
}


function mapSuitableFor(pf, obj) {
  const cleanName = pf.toLowerCase().trim();
  switch (cleanName) {
    case 'barn':
      return 'child';
    case 'senior':
      return 'senior';
    case 'voksen':
      return 'adult';
    default:
      logger.error(
        'Unknown suitableFor ' +
        `"${cleanName}" - trip.id_legacy_ntb=${obj._id}`
      );
      return 'other';
  }
}


function setSuitableFor(obj, res, handler) {
  res.suitableFor = [];

  if (obj.passer_for) {
    res.suitableFor = obj.passer_for.map((pf) => mapSuitableFor(pf, obj));
  }
}


async function mapping(obj, handler) {
  const res = {};

  if (!obj.privat) {
    obj.privat = {};
  }

  res.trip = {
    uuid: uuid4(),
    idLegacyNtb: obj._id,

    name: obj.navn || 'mangler navn',
    nameLowerCase: obj.navn ? obj.navn.toLowerCase() : 'mangler navn',

    description: obj.beskrivelse ? sanitizeHtml(obj.beskrivelse) : null,
    descriptionPlain: obj.beskrivelse ? stripHtml(obj.beskrivelse) : null,
    url: obj.url,

    grading: mapGrading(obj),
    distance: obj.distanse,
    direction: mapDirection(obj),

    durationNormalMinutes: null,
    durationNormalHours: null,
    durationNormalDays: null,
    durationMinMinutes: null,
    durationMinHours: null,
    durationMinDays: null,
    durationMaxMinutes: null,
    durationMaxHours: null,
    durationMaxDays: null,

    startingPoint: obj.privat.startpunkt,
    geojson: obj.geojson,

    season: obj.sesong || [],

    htgtGeneral: obj.adkomst,
    htgtPublicTransport: obj.kollektiv,

    license: obj.lisens.toString(),

    provider: obj.tilbyder,
    status: statusMapper(obj.status),
    updatedAt: obj.endret,

    dataSource: 'legacy-ntb',
  };

  if (obj.tidsbruk) {
    if (obj.tidsbruk.normal) {
      res.trip.durationNormalMinutes = obj.tidsbruk.normal.minutter;
      res.trip.durationNormalHours = obj.tidsbruk.normal.timer;
      res.trip.durationNormalDays = obj.tidsbruk.normal.dager;
    }
    if (obj.tidsbruk.min) {
      res.trip.durationMinMinutes = obj.tidsbruk.min.minutter;
      res.trip.durationMinHours = obj.tidsbruk.min.timer;
      res.trip.durationMinDays = obj.tidsbruk.min.dager;
    }
    if (obj.tidsbruk.max) {
      res.trip.durationMaxMinutes = obj.tidsbruk.max.minutter;
      res.trip.durationMaxHours = obj.tidsbruk.max.timer;
      res.trip.durationMaxDays = obj.tidsbruk.max.dager;
    }
  }

  // Set type
  setType(obj, res, handler);

  // Set alternative types
  setAltTypes(obj, res, handler);

  // Set county relations
  mapCounties(obj, res, handler);

  // Set municipality relations
  mapMunicipalities(obj, res, handler);

  // Set links
  setLinks(obj, res, handler);

  // Set suitable for
  setSuitableFor(obj, res, handler);

  // Areas, groups and photos
  res.areas = obj.områder || [];
  res.photos = obj.bilder || [];
  res.groups = obj.grupper || [];
  res.pois = obj.steder || [];

  return res;
}


module.exports = {
  mapping,
  structure: {
    _id: 'string',
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
        url: 'string',
        tittel: 'string',
        type: 'string',
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
      startpunkt: 'geojson',
      minutter: 'number',
    },
  },
};

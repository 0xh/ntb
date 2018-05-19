import uuid4 from 'uuid/v4';

import { geojsonToPolyline } from '@turistforeningen/ntb-shared-gis-utils';
import {
  sanitizeHtml,
  stripHtml,
} from '@turistforeningen/ntb-shared-text-content-utils';
import { createLogger } from '@turistforeningen/ntb-shared-utils';

import statusMapper from '../lib/statusMapper';


const logger = createLogger();


export function mapActivityType(type, obj) {
  switch (type) {
    case 'alpint':
      return null;
    case 'bretur':
      return 'glacier trip';
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
      return 'caving';
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
      return 'padling';
    case 'skitur':
      return 'ski touring';
    case 'skøytetur':
      return 'ice skating';
    case 'skogstur':
      return 'woodland outing';
    case 'snowboard':
      return null;
    case 'snøhuletur':
      return 'snow caving';
    case 'sopptur':
      return 'mushroom picking';
    case 'sykkeltur':
      return 'cycling';
    case 'telemark':
      return null;
    case 'terrengsykling':
      return 'off-road biking';
    case 'telttur':
      return 'camping';
    case 'topptur':
      return 'summit';
    case 'trilletur':
      return 'pram tour';
    default:
      logger.error(
        `Unknown trip type "${type}" on ` +
        `trip.id_legacy_ntb=${obj._id}`
      );
      return null;
  }
}


function setPrimaryActivityType(obj, res, handler) {
  const type = obj.tags && obj.tags.length ? obj.tags[0].toLowerCase() : null;
  res.trip.activityType = mapActivityType(type.toLowerCase().trim(), obj);
}


function setActivitySubTypes(obj, res, handler) {
  let types = [];
  if (obj.tags && obj.tags.length > 1) {
    types = types.concat(
      obj.tags.splice(1).map((tag) => mapActivityType(tag.toLowerCase(), obj))
    );
  }

  types = Array.from(new Set(types));

  res.activitySubTypes = types
    .filter((activitySubType) => activitySubType)
    .filter((activitySubType) => activitySubType !== res.trip.activityType)
    .map((activitySubType, sortIndex) => ({
      activitySubType,
      activityType: res.trip.activityType,
      idTripLegacyNtb: obj._id,
      sortIndex: sortIndex + 1,
      primary: false,
    }));

  res.activitySubTypes = [{
    activityType: res.trip.activityType,
    activitySubType: null,
    idTripLegacyNtb: obj._id,
    sortIndex: 0,
    primary: false,
  }].concat(res.activitySubTypes);
}


function setLinks(obj, res, handler) {
  res.links = [];

  if (obj.lenker && obj.lenker.length) {
    obj.lenker.forEach((link, idx) => {
      if (link.url) {
        res.links.push({
          id: uuid4(),
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


function mapGrading(obj) {
  if (!obj.gradering) {
    return 'moderate';
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
    case 'ba':
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


function setSuitableForChildren(obj, res, handler) {
  if (obj.passer_for && obj.passer_for.length) {
    res.trip.suitableForChildren = obj.passer_for.includes('Barn');
  }
}


function getStartingPoint(obj) {
  if (obj.privat.startpunkt) {
    return obj.privat.startpunkt;
  }

  if (
    obj.geojson &&
    obj.geojson.coordinates &&
    obj.geojson.coordinates.length
  ) {
    return {
      type: 'Point',
      coordinates: obj.geojson.coordinates[0],
    };
  }

  return null;
}


async function mapping(obj, handler) {
  const res = {};

  if (!obj.privat) {
    obj.privat = {};
  }

  if (!obj.rute) {
    obj.rute = {};
  }

  if (!obj.rute.kvisting) {
    obj.rute.kvisting = {};
  }

  res.trip = {
    id: uuid4(),
    idLegacyNtb: obj._id,

    name: obj.navn || 'mangler navn',
    nameLowerCase: obj.navn ? obj.navn.toLowerCase() : 'mangler navn',

    description: obj.beskrivelse ? sanitizeHtml(obj.beskrivelse) : null,
    descriptionPlain: obj.beskrivelse ? stripHtml(obj.beskrivelse) : null,
    url: obj.url,

    grading: mapGrading(obj),
    suitableForChildren: false, // Updated in setSuitableForChildren()
    distance: obj.distanse,
    direction: mapDirection(obj),

    durationMinutes: null,
    durationHours: null,
    durationDays: null,

    startingPoint: getStartingPoint(obj),
    path: obj.geojson,
    pathPolyline: obj.geojson ? geojsonToPolyline(obj.geojson) : null,

    season: obj.sesong || [],

    htgtGeneral: obj.adkomst,
    htgtPublicTransport: obj.kollektiv,

    license: obj.lisens.toString(),

    provider: obj.tilbyder,
    status: statusMapper(obj.status),
    updatedAt: obj.endret,

    dataSource: 'legacy-ntb',
  };

  if (obj.tidsbruk && obj.tidsbruk.normal) {
    res.trip.durationMinutes = obj.tidsbruk.normal.minutter;
    res.trip.durationHours = obj.tidsbruk.normal.timer;
    res.trip.durationDays = obj.tidsbruk.normal.dager;
  }

  // Set activity type
  setPrimaryActivityType(obj, res, handler);

  // Set alternative types
  setActivitySubTypes(obj, res, handler);

  // Set links
  setLinks(obj, res, handler);

  // Set suitable for children
  setSuitableForChildren(obj, res, handler);

  // Areas, groups and pictures
  res.areas = Array.from(new Set(obj.områder || []));
  res.pictures = Array.from(new Set(obj.bilder || []));
  res.groups = Array.from(new Set(obj.grupper || []));
  res.pois = Array.from(new Set(obj.steder || []));

  return res;
}


export default {
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

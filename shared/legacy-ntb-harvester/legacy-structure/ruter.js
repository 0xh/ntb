import uuid4 from 'uuid/v4';

import {
  sanitizeHtml,
  stripHtml,
} from '@turistforeningen/ntb-shared-text-content-utils';
import { createLogger } from '@turistforeningen/ntb-shared-utils';

import statusMapper from '../lib/statusMapper';
import { mapActivityType } from './turer';


const logger = createLogger();


function setSuitableActivityTypes(obj, res, handler) {
  const type = obj.tags && obj.tags.length ? obj.tags[0].toLowerCase() : null;
  const primaryType = mapActivityType(type.toLowerCase().trim(), obj);

  let types = [];
  if (obj.tags && obj.tags.length > 1) {
    types = types.concat(
      obj.tags.splice(1).map((tag) => mapActivityType(tag.toLowerCase(), obj))
    );
  }

  types = Array.from(new Set(types));

  res.suitableActivityTypes = types
    .filter((activitySubType) => activitySubType)
    .filter((activitySubType) => activitySubType !== primaryType)
    .map((activitySubType, sortIndex) => ({
      activitySubType,
      activityType: primaryType,
      idRouteLegacyNtb: obj._id,
      sortIndex: sortIndex + 1,
      primary: false,
    }));

  res.suitableActivityTypes = [{
    activityType: primaryType,
    activitySubType: null,
    idRouteLegacyNtb: obj._id,
    sortIndex: 0,
    primary: false,
  }].concat(res.suitableActivityTypes);
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
          idRouteLegacyNtb: obj._id,
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
            `"${cleanName}" -.route.id_legacy_ntb=${obj._id}`
          );
        }

        // logger.warn(
        //   'Unable to find a county for name ' +
        //   `"${cleanName}" -.route.id_legacy_ntb=${obj._id}`
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
            `"${cleanName}" -.route.id_legacy_ntb=${obj._id}`
          );
        }

        // logger.warn(
        //   'Unable to find a municipality for name ' +
        //   `"${cleanName}" -.route.id_legacy_ntb=${obj._id}`
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
        `"${cleanName}" -.route.id_legacy_ntb=${obj._id}`
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
        `"${cleanName}" -.route.id_legacy_ntb=${obj._id}`
      );
      return null;
  }
}


function setSuitableForChildren(obj, res, handler) {
  if (obj.passer_for && obj.passer_for.length) {
    res.route.suitableForChildren = obj.passer_for.includes('Barn');
  }
}


function mapWaymarkTypes(merking, obj) {
  const cleanName = merking.toLowerCase().trim();
  switch (cleanName) {
    case 't-merket':
      return 't-waymarks';
    case 'umerket':
      return 'unmarked';
    case 'merket':
    case 'lokalt merket':
      return 'other waymarks';
    case 'kvisting':
      return 'winter waymarks';
    case 'brerute':
      return 'glacier route';
    case 'båtrute':
      return 'boat route';
    default:
      logger.error(
        'Unknown waymark type ' +
        `"${cleanName}" - route.id_legacy_ntb=${obj._id}`
      );
      return 'moderate';
  }
}


function setRouteWaymarkTypes(obj, res, handler) {
  res.routeWaymarkTypes = [];

  if (obj.rute.merkinger) {
    res.routeWaymarkTypes = obj.rute.merkinger.map((merking) => ({
      name: mapWaymarkTypes(merking),
    }));
  }
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

  res.route = {
    uuid: uuid4(),
    idLegacyNtb: obj._id,
    type: obj.rute.type === 'Sommer' ? 'summer' : 'winter',
    code: obj.rute.kode,

    name: obj.navn || 'mangler navn',
    nameLowerCase: obj.navn ? obj.navn.toLowerCase() : 'mangler navn',

    description: obj.beskrivelse ? sanitizeHtml(obj.beskrivelse) : null,
    descriptionPlain: obj.beskrivelse ? stripHtml(obj.beskrivelse) : null,
    url: obj.url,

    source: obj.rute.kilde,
    notes: obj.rute.notater,

    grading: mapGrading(obj),
    suitableForChildren: false, // Updated in setSuitableForChildren()
    distance: obj.distanse,
    direction: mapDirection(obj),

    waymarkWinterAllYear: obj.rute.kvisting.helårs || false,
    waymarkWinterFrom: obj.rute.kvisting.fra,
    waymarkWinterTo: obj.rute.kvisting.til,
    waymarkWinterComment: obj.rute.kvisting.kommentar,

    durationMinutes: null,
    durationHours: null,
    durationDays: null,

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
    res.route.durationMinutes = obj.tidsbruk.normal.minutter;
    res.route.durationHours = obj.tidsbruk.normal.timer;
    res.route.durationDays = obj.tidsbruk.normal.dager;
  }

  // Set suitable activity types
  setSuitableActivityTypes(obj, res, handler);

  // Set waymark types
  setRouteWaymarkTypes(obj, res, handler);

  // Set county relations
  mapCounties(obj, res, handler);

  // Set municipality relations
  mapMunicipalities(obj, res, handler);

  // Set links
  setLinks(obj, res, handler);

  // Set suitable for children
  setSuitableForChildren(obj, res, handler);

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

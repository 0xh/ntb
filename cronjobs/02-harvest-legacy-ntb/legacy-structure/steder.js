import uuid4 from 'uuid/v4';

import {
  sanitizeHtml,
  stripHtml,
} from '@turistforeningen/ntb-shared-text-content-utils';
import { createLogger } from '@turistforeningen/ntb-shared-utils';

import statusMapper from '../lib/statusMapper';


// TODO(Roar):
// - Bilder


const logger = createLogger();


function mapType(type, obj) {
  switch (type) {
    case 'akebakke':
      return 'sledding hill';
    case 'attraksjon':
      return 'attraction';
    case 'badeplass':
      return 'bathing spot';
    case 'bro':
      return 'bridge';
    case 'bu':
      return 'hut';
    case 'fiskeplass':
      return 'fishing';
    case 'fjelltopp':
      return 'mountain peak';
    case 'gapahuk':
      return 'shelter';
    case 'geocaching':
      return 'geocaching';
    case 'grotte':
      return 'grotto';
    case 'holdeplass':
      return 'public transport stop';
    case 'kitested':
      return 'kiting area';
    case 'klatrefelt':
      return 'climbing';
    case 'parkering':
      return 'parking';
    case 'rasteplass':
      return 'picnic area';
    case 'servering':
      return 'food service';
    case 'skiltpunkt':
      return 'sign point';
    case 'skitrekk':
      return 'ski lift';
    case 'teltplass':
      return 'campground';
    case 'toalett':
      return 'toilet';
    case 'togstasjon':
      return 'train station';
    case 'turpost':
      return 'trip record';
    case 'turorientering':
      return 'orienteering';
    case 'utsiktspunkt':
      return 'lookout point';
    case 'vadested':
      return 'fording place';
    default:
      // logger.warn(
      //   `Unknown POI type "${type}" on ` +
      //   `poi.id_legacy_ntb=${obj._id}`
      // );
      return 'trip record';
  }
}


function setType(obj, res, handler) {
  const type = obj.tags && obj.tags.length ? obj.tags[0].toLowerCase() : null;
  res.poi.type = mapType(type, obj);
}


function setAltTypes(obj, res, handler) {
  res.poi.altType = obj.tags && obj.tags.length > 0
    ? obj.tags.map((tag) => mapType(tag.toLowerCase(), obj))
    : [mapType(null, obj)];

  res.poi.altType = Array.from(new Set(res.poi.altType));
}


function setCountyUuid(name, res, handler) {
  let cleanName = name.trim().toLowerCase();

  if (cleanName.endsWith('trøndelag')) {
    cleanName = 'trøndelag';
  }

  if (cleanName.startsWith('finnmark')) {
    cleanName = 'finnmark';
  }

  const match = handler.counties
    .filter((c) => c.nameLowerCase === cleanName);
  if (match.length === 1) {
    res.poi.countyUuid = match[0].uuid;
  }
  else if (match.length > 1) {
    logger.warn(
      'Found multiple counties for name ' +
      `"${cleanName}" - poi.id_legacy_ntb=${res.poi.idLegacyNtb}`
    );
  }
  else {
    logger.warn(
      'Unable to find a county for name ' +
      `"${cleanName}" - poi.id_legacy_ntb=${res.poi.idLegacyNtb}`
    );
  }
}


function setMunicipalityUuid(name, res, handler) {
  const cleanName = name.trim().toLowerCase();
  const match = handler.municipalities
    .filter((c) => c.nameLowerCase === cleanName);
  if (match.length === 1) {
    res.poi.municipalityUuid = match[0].uuid;
  }
  else if (match.length > 1) {
    logger.warn(
      'Found municipalities counties for name ' +
      `"${cleanName}" - poi.id_legacy_ntb=${res.poi.idLegacyNtb}`
    );
  }
  else {
    logger.warn(
      'Unable to find a municipality for name ' +
      `"${cleanName}" - poi.id_legacy_ntb=${res.poi.idLegacyNtb}`
    );
  }
}


function setAccessibility(obj, res, handler) {
  res.accessibility = [];

  if (obj.tilrettelagt_for) {
    res.accessibility = obj.tilrettelagt_for.map((acc) => ({
      nameLowerCase: acc.trim().toLowerCase(),
      name: acc.trim(),
      description: null,
    }));
  }
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
          idPoiLegacyNtb: obj._id,
          sortIndex: idx,
          dataSource: 'legacy-ntb',
        });
      }
    });
  }
}


async function mapping(obj, handler) {
  const res = {};

  if (!obj.privat) {
    obj.privat = {};
  }

  res.poi = {
    uuid: uuid4(),
    idLegacyNtb: obj._id,
    idSsr: obj.ssr_id,

    name: obj.navn || 'mangler navn',
    nameLowerCase: obj.navn ? obj.navn.toLowerCase() : 'mangler navn',

    description: obj.beskrivelse ? sanitizeHtml(obj.beskrivelse) : null,
    descriptionPlain: obj.beskrivelse ? stripHtml(obj.beskrivelse) : null,

    geojson: obj.geojson,

    season: obj.sesong || [],
    open: obj.åpen,

    license: obj.lisens.toString(),

    provider: obj.tilbyder,
    status: statusMapper(obj.status),
    updatedAt: obj.endret,

    dataSource: 'legacy-ntb',
  };

  // Set POI type
  setType(obj, res, handler);

  // Set alternative types
  setAltTypes(obj, res, handler);

  // Set county relation
  if (obj.fylke) {
    setCountyUuid(obj.fylke, res, handler);
  }

  // Set municipality relation
  if (obj.kommune) {
    setMunicipalityUuid(obj.kommune, res, handler);
  }

  // Set accessibility
  setAccessibility(obj, res, handler);

  // Set links
  setLinks(obj, res, handler);

  // Areas, groups and photos
  res.areas = obj.områder || [];
  res.photos = obj.bilder || [];
  res.groups = obj.grupper || [];

  return res;
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

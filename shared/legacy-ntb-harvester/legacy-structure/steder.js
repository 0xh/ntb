import uuid4 from 'uuid/v4';

import {
  sanitizeHtml,
  stripHtml,
} from '@ntb/shared-text-content-utils';

import statusMapper from '../lib/statusMapper';
import { mapAccessability } from './hytter';


// TODO(Roar):
// - Bilder


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
  let types = [res.poi.type];
  if (obj.tags && obj.tags.length > 1) {
    types = types.concat(
      obj.tags.splice(1).map((tag) => mapType(tag.toLowerCase(), obj))
    );
  }

  types = Array.from(new Set(types));

  let primary = true;
  res.altTypes = types.map((type, sortIndex) => {
    const altType = {
      type,
      idPoiLegacyNtb: obj._id,
      primary,
      sortIndex,
    };
    primary = false;
    return altType;
  });
}


function setAccessibility(obj, res, handler) {
  res.accessibility = [];

  if (obj.tilrettelagt_for) {
    res.accessibility = obj.tilrettelagt_for.map((acc) => ({
      name: mapAccessability(acc),
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
          id: uuid4(),
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
    id: uuid4(),
    idLegacyNtb: obj._id,
    idSsr: obj.ssr_id,

    name: obj.navn || 'mangler navn',
    nameLowerCase: obj.navn ? obj.navn.toLowerCase() : 'mangler navn',

    description: obj.beskrivelse ? sanitizeHtml(obj.beskrivelse) : null,
    descriptionPlain: obj.beskrivelse ? stripHtml(obj.beskrivelse) : null,

    coordinates: obj.geojson,

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

  // Set accessibility
  setAccessibility(obj, res, handler);

  // Set links
  setLinks(obj, res, handler);

  // Areas, groups and pictures
  res.areas = obj.områder || [];
  res.pictures = Array.from(new Set(obj.bilder || []));
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

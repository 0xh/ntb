import {
  sanitizeHtml,
  stripHtml,
} from '@ntb/text-content-utils';
import { Logger, uuid4 } from '@ntb/utils';

import statusMapper from '../lib/statusMapper';


const logger = Logger.getLogger();


function mapLinkType(type, res) {
  switch ((type || '').toLowerCase()) {
    case 'pris':
      return 'price';
    case 'yr':
      return 'weather';
    case 'video':
      return 'video';
    case 'booking':
      return 'booking';
    case 'hjemmeside':
      return 'homepage';
    case 'facebook':
      return 'facebook';
    case 'twitter':
      return 'twitter';
    case 'instagram':
      return 'instagram';
    case 'kart':
      return 'map';
    case 'kontaktinfo':
      return 'contact info';
    case 'annet':
    case 'annen':
      return 'other';
    default:
      if (type) {
        logger.warn(
          `Missing link type "${type}" on ` +
          `list.id_legacy_ntb=${res.list.idLegacyNtb}`
        );
      }
      return 'other';
  }
}


function setLinks(obj, res, handler) {
  res.links = [];

  if (obj.lenker && obj.lenker.length) {
    obj.lenker.forEach((link, idx) => {
      if (link.url) {
        res.links.push({
          id: uuid4(),
          type: mapLinkType(link.type, res),
          title: link.tittel,
          url: link.url,
          idListLegacyNtb: obj._id,
          sortIndex: idx,
          dataSource: 'legacy-ntb',
        });
      }
    });
  }
}


async function mapping(obj, handler) {
  const res = {};

  res.list = {
    id: uuid4(),
    idLegacyNtb: obj._id,

    name: obj.navn || 'mangler navn',
    nameLowerCase: obj.navn ? obj.navn.toLowerCase() : 'mangler navn',
    description: obj.beskrivelse ? sanitizeHtml(obj.beskrivelse) : null,
    descriptionPlain: obj.beskrivelse ? stripHtml(obj.beskrivelse) : null,

    coordinates: obj.geojson,

    startDate: obj.start,
    endDate: obj.stopp,

    license: obj.lisens,

    provider: obj.tilbyder,
    status: statusMapper(obj.status),
    updatedAt: obj.endret,

    dataSource: 'legacy-ntb',
  };

  // Set links
  setLinks(obj, res, handler);


  res.groups = obj.grupper || [];
  res.pictures = obj.bilder || [];
  res.poisAndCabins = Array.from(new Set(obj.steder || []));

  return res;
}


export default {
  mapping,
  structure: {
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
  },
};

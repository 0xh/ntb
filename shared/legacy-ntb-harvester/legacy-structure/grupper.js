import {
  sanitizeHtml,
  stripHtml,
} from '@ntb/text-content-utils';
import { Logger, uuid4 } from '@ntb/utils';

import statusMapper from '../lib/statusMapper';

// TODO(Roar):
// If group-type == "kommune", set link to municiplality
// - Ignore Sherpa-associations and fetch them seperatly from Sherpa?
// -- This would prevent us from having the correct id_legacy_ntb!
// -- We should do some kind of combination of both...?
// - Private.[endret_av|opprettet_av|registrert_av] - do we need this?
// - privat.[brukere|invitasjoner] < we need to handle this


const logger = Logger.getLogger();


function mapGroupType(tag, res) {
  switch (tag) {
    case 'barnas turlag':
      return 'dnt childrens trekking club';
    case 'bedrift':
      return 'business';
    case 'destinasjonsselskap':
      return 'destination company';
    case 'dnt':
      return 'dnt';
    case 'fjellsport':
      return 'dnt mountain sports';
    case 'fotballag':
      return 'football team';
    case 'friluftsråd':
      return 'outdoor recreation council';
    case 'fylkeskommune':
      return 'county council';
    case 'styre':
      return 'other';
    case 'hytte':
      return 'dnt cabin';
    case 'idrettslag':
      return 'sports team';
    case 'interesseorganisasjon':
      return 'interest group';
    case 'kommune':
      return 'municipality';
    case 'medlemsforening':
      return 'dnt association';
    case 'nasjonalpark':
      return 'national park';
    case 'orienteringslag':
      return 'orienteering team';
    case 'prosjket':
      return 'dnt project';
    case 'senior':
      return 'dnt senior';
    case 'sentral':
      return 'dnt central';
    case 'skole':
      return 'school';
    case 'speidergruppe':
      return 'scout group';
    case 'turistinformasjon':
      return 'tourist information';
    case 'lokalforening':
    case 'andre turgrupper':
    case 'turlag':
      return 'outdoor group';
    case 'ungdomgruppe':
      return 'dnt youth';
    default:
      if (tag.length) {
        logger.warn(
          `Unknown group type "${tag}" on ` +
          `group.id_legacy_ntb=${res.group.idLegacyNtb}`
        );
      }
      return 'other';
  }
}


function getGroupType(tags, res) {
  const tag = tags && tags.length
    ? tags[0].toLowerCase()
    : '';

  return mapGroupType(tag, res);
}


function getGroupSubType(tags, res) {
  const tag = tags && tags.length && tags.length > 1
    ? tags[1].toLowerCase()
    : null;

  if (!tag) {
    return null;
  }

  return mapGroupType(tag, res);
}


function setMunicipalityId(res, handler) {
  if (!res.group.nameLowerCase.endsWith('ommune')) {
    return;
  }

  const cleanName = res.group.nameLowerCase.replace(' kommune', '');
  const match = handler.municipalities
    .filter((c) => c.nameLowerCase === cleanName);
  if (match.length === 1) {
    res.group.municipalityId = match[0].id;
  }
  else if (match.length > 1) {
    logger.error(
      'Found multiple municipalities for name ' +
      `"${cleanName}" - group.id_legacy_ntb=${res.group.idLegacyNtb}`
    );
  }
  else {
    logger.error(
      'Unable to find a municipality for name ' +
      `"${cleanName}" - group.id_legacy_ntb=${res.group.idLegacyNtb}`
    );
  }
}


function mapLinkType(type, res) {
  switch ((type || '').toLowerCase()) {
    case 'hjemmeside':
      return 'homepage';
    case 'facebook':
      return 'facebook';
    case 'twitter':
      return 'twitter';
    case 'instagram':
      return 'instagram';
    case 'youtube':
      return 'youtube';
    case 'vilkår':
      return 'terms';
    case 'risikovurdering':
      return 'risk assessment';
    case 'kontaktinfo':
      return 'contact info';
    case 'kart':
      return 'map';
    case 'annet':
      return 'other';
    default:
      logger.warn(
        `Missing or unknown link type "${type}" on ` +
        `group.id_legacy_ntb=${res.group.idLegacyNtb}`
      );
      return 'other';
  }
}


function setLinks(obj, res, handler) {
  res.links = [];

  if (obj.lenker && obj.lenker.length) {
    obj.lenker.forEach((link, idx) => {
      res.links.push({
        id: uuid4(),
        type: mapLinkType(link.type, res),
        title: link.tittel,
        url: link.url,
        idGroupLegacyNtb: obj._id,
        sortIndex: idx,
        dataSource: 'legacy-ntb',
      });
    });
  }
}


async function mapping(obj, handler) {
  const res = {};

  res.group = {
    id: uuid4(),
    idLegacyNtb: obj._id,
    name: obj.navn,
    nameLowerCase: obj.navn.toLowerCase(),

    description: obj.beskrivelse ? sanitizeHtml(obj.beskrivelse) : null,
    descriptionPlain: obj.beskrivelse ? stripHtml(obj.beskrivelse) : null,

    logo: obj.logo,
    organizationNumber: obj.organisasjonsnr,

    url: obj.url,
    license: obj.lisens,

    provider: obj.tilbyder,
    status: statusMapper(obj.status),
    updatedAt: obj.endret,

    dataSource: 'legacy-ntb',
  };

  // Group type
  res.group.groupType = getGroupType(obj.tags, res);
  res.group.groupSubType = getGroupSubType(obj.tags, res);

  // Contact info
  if (obj.kontaktinfo && obj.kontaktinfo.length) {
    if (obj.kontaktinfo.length > 1) {
      logger.error(
        `${obj.kontaktinfo.length} contact info sets found for ` +
        `"${res.group.name}" - group.id_legacy_ntb=${res.group.idLegacyNtb}`
      );
    }

    const c = obj.kontaktinfo[0];
    res.group.email = c.epost;
    res.group.phone = c.telefon;
    res.group.mobile = c.mobil;
    res.group.fax = c.fax;
    res.group.address1 = c.adresse1;
    res.group.address2 = c.adresse2;
    res.group.postalCode = c.postnummer;
    res.group.postalName = c.poststed;
  }

  // Set links
  setLinks(obj, res, handler);

  // Set municipality relation if the group is a municipality
  if (res.group.type === 'kommune') {
    setMunicipalityId(res, handler);
  }


  return res;
}


module.exports = {
  mapping,
  structure: {
    _id: 'string',

    navn: 'string',
    beskrivelse: 'string',

    lisens: 'string',
    url: 'string',

    tilbyder: 'string',
    status: 'string',
    endret: 'date',

    grupper: 'array-strings',
    tags: 'array-strings',
    navngiving: 'string',
    logo: 'string',
    foreldregruppe: 'string',
    foreldregrupper: 'array-strings',
    checksum: 'string',
    organisasjonsnr: 'string',
    privat: {
      sherpa2_id: 'number',
      endret_av: {
        epost: 'string',
        id: 'string',
        navn: 'string',
      },
      opprettet_av: {
        epost: 'string',
        email: 'string',
        id: 'string',
        navn: 'string',
        name: 'string',
      },
      registrert_av: {
        email: 'string',
        id: 'string',
        name: 'string',
      },
      brukere: [
        {
          id: 'string',
          pbkdf2: 'ignore',
          navn: 'string',
          name: 'string',
          epost: 'string',
          email: 'string',
          konvertert: 'boolean',
          konvertert_av: {
            id: 'string',
            navn: 'string',
            epost: 'string',
          },
        },
      ],
      invitasjoner: 'ignore',
    },
    lenker: [
      {
        type: 'string',
        url: 'string',
        tittel: 'string',
      },
    ],
    kontaktinfo: [
      {
        type: 'string',
        epost: 'string',
        telefon: 'string',
        mobil: 'string',
        fax: 'string',
        tittel: 'string',
        poststed: 'string',
        adresse1: 'string',
        adresse2: 'string',
        postnummer: 'number',
      },
    ],
  },
};

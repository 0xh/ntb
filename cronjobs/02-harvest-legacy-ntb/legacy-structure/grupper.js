import uuid4 from 'uuid/v4';

import { processContent } from '@turistforeningen/ntb-shared-process-content';
import { createLogger } from '@turistforeningen/ntb-shared-utils';

import statusMapper from '../lib/statusMapper';

// TODO(Roar):
// - translate group type like we do with link type
// - Ignore Sherpa-associations and fetch them seperatly from Sherpa?
// -- This would prevent us from having the correct id_legacy_ntb!
// -- We should do some kind of combination of both...?
// - Private.[endret_av|opprettet_av|registrert_av] - do we need this?
// - privat.[brukere|invitasjoner] < we need to handle this


const logger = createLogger();


function setMunicipalityUuid(res, handler) {
  if (!res.group.nameLowerCase.endsWith('ommune')) {
    return;
  }

  const cleanName = res.group.nameLowerCase.replace(' kommune', '');
  const match = handler.municipalities
    .filter((c) => c.nameLowerCase === cleanName);
  if (match.length === 1) {
    res.group.municipalityUuid = match[0].uuid;
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


function mapGroupType(tags, res) {
  const tag = tags && tags.length
    ? tags[0].toLowerCase()
    : '';

  switch (tag) {
    case 'bedrift':
      return 'business';
    case 'destinasjonsselskap':
      return 'destination company';
    case 'dnt':
      return 'dnt';
    case 'fotballag':
      return 'football team';
    case 'fylkeskommune':
      return 'county council';
    case 'idrettslag':
      return 'sports team';
    case 'interesseorganisasjon':
      return 'interest group';
    case 'kommune':
      return 'municipality';
    case 'nasjonalpark':
      return 'national park';
    case 'orienteringslag':
      return 'orienteering team';
    case 'skole':
      return 'school';
    case 'speidergruppe':
      return 'scout group';
    case 'turistinformasjon':
      return 'tourist information';
    case 'turlag':
      return 'outdoor group';
    default:
      if (tag.length) {
        logger.error(
          `Unknown group type "${tag}" on ` +
          `group.id_legacy_ntb=${res.group.idLegacyNtb}`
        );
      }
      return 'other';
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
      logger.error(
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
        uuid: uuid4(),
        type: mapLinkType(link.type, res),
        title: link.tittel,
        url: link.url,
        idGroupLegacyNtb: obj._id,
        idxGroupLegacyNtb: idx,
        dataSource: 'legacy-ntb',
      });
    });
  }
}


function setTags(obj, res, handler) {
  res.tags = obj.tags && obj.tags.length > 1
    ? obj.tags.splice(1)
    : [];
}


async function mapping(obj, handler) {
  const res = {};
  let description = {};

  if (obj.beskrivelse) {
    description = await processContent(obj.beskrivelse);
  }

  res.group = {
    uuid: uuid4(),
    idLegacyNtb: obj._id,
    name: obj.navn,
    nameLowerCase: obj.navn.toLowerCase(),

    description: description.sanitized || null,
    descriptionPlain: description.plain || null,
    descriptionWords: description.words || null,
    descriptionWordsStemmed: description.stemmed || null,

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
  res.group.type = mapGroupType(obj.tags, res);

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

  // Set municipality relation
  if (res.group.type === 'kommune') {
    setMunicipalityUuid(res, handler);
  }

  // Set links
  setLinks(obj, res, handler);

  // Set tags
  setTags(obj, res, handler);

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

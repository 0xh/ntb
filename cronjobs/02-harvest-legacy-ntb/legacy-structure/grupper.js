import uuid4 from 'uuid/v4';

import { cleanWord, stemAll } from '@turistforeningen/ntb-shared-hunspell';
import { createLogger } from '@turistforeningen/ntb-shared-utils';

import statusMapper from '../lib/statusMapper';

// TODO(Roar):
// - Ignore Sherpa-associations and fetch them seperatly from Sherpa?
// -- This would prevent us from having the correct id_legacy_ntb!
// -- We should do some kind of combination of both...?
// - Contact info
// - Links
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


async function mapping(obj, handler) {
  const res = {};
  const description = {};

  if (obj.beskrivelse) {
    description.original = obj.beskrivelse.trim();
    description.plain = description.original
      .replace(/<{1}[^<>]{1,}>{1}/g, ' ') // replace html-tags
      .replace(/\u00a0/g, ' ') // replace nbsp-character
      .trim();
    description.words = Array.from(new Set(
      description.plain
        .split(' ')
        .map((w) => cleanWord(w.toLowerCase()))
        .filter((w) => w)
    ));
    description.stemmed = await stemAll('nb', description.words);
  }

  res.group = {
    uuid: uuid4(),
    idLegacyNtb: obj._id,
    type: obj.tags && obj.tags.length ? obj.tags[0].toLowerCase() : null,
    name: obj.navn,
    nameLowerCase: obj.navn.toLowerCase(),

    description: description.original || null,
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

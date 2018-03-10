import uuid4 from 'uuid/v4';

import {
  sanitizeHtml,
  stripHtml,
} from '@turistforeningen/ntb-shared-text-content-utils';
import { createLogger } from '@turistforeningen/ntb-shared-utils';

import statusMapper from '../lib/statusMapper';


// TODO(Roar):
// - Translate facilities?


const logger = createLogger();


function mapServiceLevelHelper(level) {
  switch ((level || '').toLowerCase()) {
    case 'selvbetjent':
      return 'self service';
    case 'betjent':
      return 'serviced';
    case 'ubetjent':
      return 'unmanned';
    case 'stengt':
      return 'closed';
    case 'servering':
      return 'dining';
    case 'dagshytte':
      return 'unmanned (no beds)';
    case 'nødbu':
      return 'emergency shelter';
    default:
      return null;
  }
}


function mapServiceLevel(level, ob) {
  const l = mapServiceLevelHelper(level);

  if (!l && level) {
    logger.warn(
      `Unknown service level "${level}" on ` +
      `cabin.id_legacy_ntb=${ob._id}`
    );
  }

  return l;
}


function setCountyUuid(name, res, handler) {
  let cleanName = name.trim().toLowerCase();

  if (cleanName.endsWith('trøndelag')) {
    cleanName = 'trøndelag';
  }

  const match = handler.counties
    .filter((c) => c.nameLowerCase === cleanName);
  if (match.length === 1) {
    res.cabin.countyUuid = match[0].uuid;
  }
  else if (match.length > 1) {
    logger.warn(
      'Found multiple counties for name ' +
      `"${cleanName}" - cabin.id_legacy_ntb=${res.cabin.idLegacyNtb}`
    );
  }
  else {
    logger.warn(
      'Unable to find a county for name ' +
      `"${cleanName}" - cabin.id_legacy_ntb=${res.cabin.idLegacyNtb}`
    );
  }
}


function setMunicipalityUuid(name, res, handler) {
  const cleanName = name.trim().toLowerCase();
  const match = handler.municipalities
    .filter((c) => c.nameLowerCase === cleanName);
  if (match.length === 1) {
    res.cabin.municipalityUuid = match[0].uuid;
  }
  else if (match.length > 1) {
    logger.warn(
      'Found municipalities counties for name ' +
      `"${cleanName}" - cabin.id_legacy_ntb=${res.cabin.idLegacyNtb}`
    );
  }
  else {
    logger.warn(
      'Unable to find a municipality for name ' +
      `"${cleanName}" - cabin.id_legacy_ntb=${res.cabin.idLegacyNtb}`
    );
  }
}


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
    case 'kontaktinfo':
      return 'contact info';
    case 'annen':
      return 'other';
    default:
      logger.warn(
        `Missing or unknown link type "${type}" on ` +
        `cabin.id_legacy_ntb=${res.cabin.idLegacyNtb}`
      );
      return 'other';
  }
}


function setLinks(obj, res, handler) {
  res.links = [];

  if (obj.lenker && obj.lenker.length) {
    let bookingLinkFound = false;

    obj.lenker.forEach((link, idx) => {
      // Skip first booking link as it will be added to the booking fields in
      // setBooking()
      if (link.type === 'Booking' && !bookingLinkFound) {
        bookingLinkFound = true;
        return;
      }

      res.links.push({
        uuid: uuid4(),
        type: mapLinkType(link.type, res),
        title: link.tittel,
        url: link.url,
        idCabinLegacyNtb: obj._id,
        idxCabinLegacyNtb: idx,
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


function setFacilities(obj, res, handler) {
  res.facilities = [];

  if (obj.fasiliteter) {
    res.facilities = Object.keys(obj.fasiliteter).map((facility) => ({
      nameLowerCase: facility.trim().toLowerCase(),
      name: facility.trim(),
      description: obj.fasiliteter[facility].trim(),
    }));
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

  if (obj.tilrettelegginger) {
    obj.tilrettelegginger.forEach((acc) => {
      const type = acc.type.trim();
      const description = acc.kommentar ? acc.kommentar.trim() : null;
      const match = res.accessibility
        .filter((a) => a.name === type);

      if (!match.length) {
        res.accessibility[type] = {
          nameLowerCase: type.toLowerCase(),
          name: type,
          description,
        };
      }
      else {
        match[0].description = description;
      }
    });
  }
}


function mapOpeningHoursServiceLevel(level, res) {
  const l = mapServiceLevelHelper(level);

  if (!l) {
    if (level) {
      logger.warn(
        `Unknown opening hours service level "${level}" on ` +
        `cabin.id_legacy_ntb=${res.cabin.idLegacyNtb}`
      );
    }
    return null;
  }

  return l;
}


function mapOpeningHoursKey(key, res) {
  switch ((key || '').toLowerCase()) {
    case 'dnt-nøkkel':
      return 'dnt-key';
    case 'ulåst':
      return 'unlocked';
    case 'spesialnøkkel':
      return 'special key';
    default:
      if (key) {
        logger.warn(
          `Unknown opening hours key "${key}" on ` +
          `cabin.id_legacy_ntb=${res.cabin.idLegacyNtb}`
        );
      }
      return null;
  }
}


function setOpeningHours(obj, res, handler) {
  res.openingHours = [];

  if (obj.privat && obj.privat.åpningstider) {
    obj.privat.åpningstider.forEach((o) => {
      res.openingHours.push({
        allYear: o.helårs ? o.helårs.toLowerCase() === 'ja' : null,
        from: o.fra, // date
        to: o.til, // date
        serviceLevel: mapOpeningHoursServiceLevel(o.betjeningsgrad, res),
        key: mapOpeningHoursKey(o.nøkkel, res),
        description: o.kommentar,
      });
    });
  }
}


function setBooking(obj, res, handler) {
  res.cabin.bookingEnabled = false;
  res.cabin.bookingOnly = false;
  res.cabin.bookingUrl = null;

  if (obj.lenker) {
    obj.lenker.forEach((link) => {
      if (!res.cabin.bookingUrl && link.type === 'Booking') {
        res.cabin.bookingEnabled = true;
        res.cabin.bookingUrl = link.url;
      }
    });
  }
}


function setDntCabin(obj, res, handler) {
  res.cabin.dntCabin = (obj.privat.hytteeier || '').toLowerCase() === 'dnt';
  res.cabin.dntDiscount = (
    res.cabin.dntCabin ||
    (obj.privat.hytteeier || '').toLowerCase() === 'rabatt'
  );
}


async function setEnglishTranslation(obj, res, handler) {
  res.english = null;

  if (obj.description) {
    res.english = {
      uuid: uuid4(),
      name: obj.navn || 'name missing',
      nameLowerCase: obj.navn ? obj.navn.toLowerCase() : 'name missing',
      cabinIdLegacyNtb: obj._id,
      description: sanitizeHtml(obj.description),
      descriptionPlain: stripHtml(obj.description),
      language: 'en',
    };
  }
}


async function mapping(obj, handler) {
  const res = {};

  if (!obj.privat) {
    obj.privat = {};
  }

  res.cabin = {
    uuid: uuid4(),
    idLegacyNtb: obj._id,
    idSsr: obj.ssr_id,
    maintainerIdGroupLegacyNtb: obj.privat && obj.privat.vedlikeholdes_av
      ? obj.privat.vedlikeholdes_av
      : null,
    ownerIdGroupLegacyNtb: obj.privat && obj.privat.juridisk_eier
      ? obj.privat.juridisk_eier
      : null,
    contactIdGroupLegacyNtb: null, // updated below

    name: obj.navn || 'mangler navn',
    nameLowerCase: obj.navn ? obj.navn.toLowerCase() : 'mangler navn',
    nameAlt: obj.navn_alt
      ? obj.navn_alt.map((n) => n.trim()).filter((n) => n)
      : null,
    nameAltLowerCase: obj.navn_alt
      ? obj.navn_alt.map((n) => n.toLowerCase().trim()).filter((n) => n)
      : null,

    description: obj.beskrivelse ? sanitizeHtml(obj.beskrivelse) : null,
    descriptionPlain: obj.beskrivelse ? stripHtml(obj.beskrivelse) : null,

    url: obj.url,
    yearOfConstruction: obj.byggeår,

    geojson: obj.geojson,

    serviceLevel: mapServiceLevel(obj.betjeningsgrad, obj),

    bedsExtra: obj.senger && obj.senger.ekstra
      ? obj.senger.ekstra
      : 0,
    bedsServiced: obj.senger && obj.senger.betjent
      ? obj.senger.betjent
      : 0,
    bedsSelfService: obj.senger && obj.senger.selvbetjent
      ? obj.senger.selvbetjent
      : 0,
    bedsUnmanned: obj.senger && obj.senger.ubetjent
      ? obj.senger.ubetjent
      : 0,
    bedsWinter: obj.senger && obj.senger.vinter
      ? obj.senger.vinter
      : 0,

    htgtWinter: obj.adkomst && obj.adkomst.vinter
      ? sanitizeHtml(obj.adkomst.vinter)
      : null,
    htgtSummer: obj.adkomst && obj.adkomst.sommer
      ? sanitizeHtml(obj.adkomst.sommer)
      : null,
    htgtOtherWinter:
      obj.tilkomst && obj.tilkomst.privat && obj.tilkomst.privat.vinter
        ? sanitizeHtml(obj.tilkomst.privat.vinter)
        : null,
    htgtOtherSummer:
      obj.tilkomst && obj.tilkomst.privat && obj.tilkomst.privat.sommer
        ? sanitizeHtml(obj.tilkomst.privat.sommer)
        : null,

    map: obj.kart,
    mapAlt: obj.turkart
      ? obj.turkart.map((n) => n.trim()).filter((n) => n)
      : null,

    license: obj.lisens,

    provider: obj.tilbyder,
    status: statusMapper(obj.status),
    updatedAt: obj.endret,

    dataSource: 'legacy-ntb',
  };

  // Reset empty arrays to null
  ['nameAlt', 'nameAltLowerCase', 'mapAlt'].forEach((key) => {
    if (!res.cabin[key]) {
      res.cabin[key] = null;
    }
  });

  // Contact info
  // use either 'sesong' or 'utenom_sesong' depending on ig the section
  // has a 'gruppe_id' or not
  let cabinContact = null;
  const kontaktinfo = obj.privat ? obj.privat.kontaktinfo || {} : {};
  if (kontaktinfo.sesong && kontaktinfo.sesong.gruppe_id) {
    res.cabin.contactIdGroupLegacyNtb = kontaktinfo.sesong.gruppe_id;
  }
  else if (kontaktinfo.sesong) {
    cabinContact = kontaktinfo.sesong;
  }
  if (kontaktinfo.utenom_sesong && kontaktinfo.utenom_sesong.gruppe_id) {
    res.cabin.contactIdGroupLegacyNtb = kontaktinfo.utenom_sesong.gruppe_id;
  }
  else if (kontaktinfo.utenom_sesong) {
    cabinContact = kontaktinfo.utenom_sesong;
  }

  if (cabinContact) {
    res.cabin.contactName = cabinContact.kontaktperson || cabinContact.navn;
    res.cabin.email = cabinContact.epost;
    res.cabin.phone = cabinContact.telefon;
    res.cabin.mobile = cabinContact.mobil;
    res.cabin.fax = cabinContact.fax;
    res.cabin.address1 = cabinContact.adresse || cabinContact.adresse1;
    res.cabin.address2 = cabinContact.adresse2;
    res.cabin.postalCode = cabinContact.postnummer;
    res.cabin.postalName = cabinContact.poststed;
  }

  // Set county relation
  if (obj.fylke) {
    setCountyUuid(obj.fylke, res, handler);
  }

  // Set municipality relation
  if (obj.kommune) {
    setMunicipalityUuid(obj.kommune, res, handler);
  }

  // Set english translation
  await setEnglishTranslation(obj, res, handler);

  // Set links
  setLinks(obj, res, handler);

  // Set tags
  setTags(obj, res, handler);

  // Set facilities
  setFacilities(obj, res, handler);

  // Set accessibility
  setAccessibility(obj, res, handler);

  // Set accessibility
  setOpeningHours(obj, res, handler);

  // Set booking
  setBooking(obj, res, handler);

  // Set true/false if its a DNT cabin and if members get discount
  setDntCabin(obj, res, handler);

  // Areas and photos
  res.areas = obj.områder;
  res.photos = obj.bilder;

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
      Booking: 'string',
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
          kommentar: 'string',
        },
      ],
      kontaktinfo: {
        sesong: {
          epost: 'string',
          postnummer: 'number',
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
          kontaktperson: 'string',
        },
        utenom_sesong: {
          epost: 'string',
          postnummer: 'number',
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
          kontaktperson: 'string',
        },
      },
      sherpa2_id: 'number',
      gammel_url: 'string',
      juridisk_eier: 'string',
      vedlikeholdes_av: 'string',
      kun_bestilling: 'string', // "Ja|Nei"  566935556589383438cdfa65
      kun_bestilling_kommentar: 'string', // 566935556589383438cdfa65
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
      hyttetype: 'number',
      hytteeier: 'string',
      senger: {
        vinter: 'number',
        ekstra: 'number',
        betjent: 'number',
        selvbetjent: 'number',
        ubetjent: 'number',
      },
    },
  },
};

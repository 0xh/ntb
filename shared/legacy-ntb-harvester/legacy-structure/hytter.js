import {
  sanitizeHtml,
  stripHtml,
} from '@ntb/text-content-utils';
import { createLogger, uuid4 } from '@ntb/utils';

import statusMapper from '../lib/statusMapper';


// TODO(Roar):
// - Bilder


const logger = createLogger();


function mapServiceLevelHelper(level) {
  switch ((level || '').toLowerCase()) {
    case 'selvbetjent':
      return 'self-service';
    case 'betjent':
      return 'staffed';
    case 'ubetjent':
      return 'no-service';
    case 'stengt':
      return 'closed';
    case 'servering':
      return 'food service';
    case 'dagshytte':
      return 'no-service (no beds)';
    case 'nødbu':
      return 'emergency shelter';
    default:
      return null;
  }
}


function mapServiceLevel(level, obj) {
  const l = mapServiceLevelHelper(level);

  if (!l && level) {
    logger.warn(
      `Unknown service level "${level}" on ` +
      `cabin.id_legacy_ntb=${obj._id}`
    );
  }

  return l;
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
        id: uuid4(),
        type: mapLinkType(link.type, res),
        title: link.tittel,
        url: link.url,
        idCabinLegacyNtb: obj._id,
        sortIndex: idx,
        dataSource: 'legacy-ntb',
      });
    });
  }
}


function mapFacilityType(type, res) {
  switch ((type || '').toLowerCase().trim()) {
    case '12v':
      return '12v';
    case '220v':
      return '220v';
    case 'bade':
      return 'swimming';
    case 'badstu':
      return 'sauna';
    case 'booking':
      return 'booking';
    case 'båt':
      return 'boat';
    case 'dusj':
      return 'shower';
    case 'fiske':
      return 'fishing';
    case 'kano':
      return 'canoe';
    case 'kortbetaling':
      return 'credit card payment';
    case 'lokalmat':
      return 'local food';
    case 'mobildekning':
      return 'mobile coverage';
    case 'peis':
      return 'fireplace';
    case 'servering':
      return 'food service';
    case 'steikeovn':
      return 'oven';
    case 'strømovn':
      return 'heater';
    case 'sykkelutleie':
      return 'bicycle rentals';
    case 'telefon':
      return 'phone';
    case 'teltplass':
      return 'tent site';
    case 'tørkerom':
      return 'drying room';
    case 'utleie':
      return 'rental';
    case 'vann':
      return 'water';
    case 'vedovn':
      return 'wood stove';
    case 'wc':
      return 'wc';
    default:
      logger.warn(
        `Missing or unknown facility type "${type}" on ` +
        `cabin.id_legacy_ntb=${res.cabin.idLegacyNtb}`
      );
      return 'other';
  }
}


function setFacilities(obj, res, handler) {
  res.facilities = [];

  if (obj.fasiliteter) {
    res.facilities = Object.keys(obj.fasiliteter).map((facility) => ({
      name: mapFacilityType(facility),
      description: obj.fasiliteter[facility].trim(),
    }));
  }
}


export function mapAccessability(type, res) {
  switch ((type || '').toLowerCase().trim()) {
    case 'barnevogn':
      return 'stroller';
    case 'barnevennlig':
      return 'kid friendly';
    case 'handikap':
      return 'handicap';
    case 'hund':
      return 'dog';
    case 'rullestol':
      return 'wheelchair';
    case 'skolehytte':
    case 'skoleklasser':
      return 'school classes';
    default:
      logger.warn(
        `Missing or unknown accessability type "${type}" on ` +
        `cabin.id_legacy_ntb=${res.cabin.idLegacyNtb}`
      );
      return 'other';
  }
}


function setAccessibility(obj, res, handler) {
  res.accessibility = [];

  if (obj.tilrettelagt_for) {
    res.accessibility = obj.tilrettelagt_for.map((acc) => ({
      name: mapAccessability(acc, res),
      description: null,
    }));
  }

  if (obj.tilrettelegginger) {
    obj.tilrettelegginger.forEach((acc) => {
      const type = mapAccessability(acc.type);
      const description = acc.kommentar ? acc.kommentar.trim() : null;
      const match = res.accessibility
        .filter((a) => a.name === type);

      if (!match.length) {
        res.accessibility.push({
          name: type,
          description,
        });
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
    obj.privat.åpningstider.forEach((o, idx) => {
      res.openingHours.push({
        id: uuid4(),
        allYear: o.helårs ? o.helårs.toLowerCase() === 'ja' : false,
        from: o.fra, // date
        to: o.til, // date
        serviceLevel: mapOpeningHoursServiceLevel(o.betjeningsgrad, res),
        key: mapOpeningHoursKey(o.nøkkel, res),
        description: o.kommentar,
        idCabinLegacyNtb: obj._id,
        sortIndex: idx,
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


function processTags(obj, res, handler) {
  const tags = obj.tags && obj.tags.length > 1
    ? obj.tags.splice(1)
    : [];

  tags.forEach((tag) => {
    const cleanName = tag.toLowerCase().trim();
    if (cleanName === 'fiske') {
      res.facilities.push({
        name: mapFacilityType(cleanName),
        description: null,
      });
    }
    else if (cleanName === 'lokalmat') {
      res.facilities.push({
        name: mapFacilityType(cleanName),
        description: null,
      });
    }
    else if (cleanName === 'bade') {
      res.facilities.push({
        name: mapFacilityType(cleanName),
        description: null,
      });
    }
    else if (cleanName === 'barnevennlig') {
      let exists = false;
      const accessabilityName = mapAccessability('barnevennlig');

      res.accessibility.forEach((a) => {
        if (a.name === accessabilityName) {
          exists = true;
        }
      });

      if (!exists) {
        res.accessibility.push({
          name: accessabilityName,
          description: null,
        });
      }
    }
    else if (cleanName === 'skolehytte') {
      let exists = false;
      const accessabilityName = mapAccessability('skolehytte');

      res.accessibility.forEach((a) => {
        if (a.name === accessabilityName) {
          exists = true;
        }
      });

      if (!exists) {
        res.accessibility.push({
          name: accessabilityName,
          description: null,
        });
      }
    }
    else if (cleanName === 'kollektiv') {
      res.cabin.htgtPublicTransportAvailable = true;
    }
    else if (cleanName === 'båttransport') {
      res.cabin.htgtBoatTransportAvailable = true;
    }
    else if (cleanName === 'sykkel') {
      res.cabin.htgtBicycle = true;
    }
    else if (cleanName === 'sommerbil') {
      res.cabin.htgtCarSummer = true;
    }
    else if (cleanName === 'helårsbil') {
      res.cabin.htgtCarAllYear = true;
    }
  });
}


async function setEnglishTranslation(obj, res, handler) {
  res.english = null;

  if (obj.description) {
    res.english = {
      id: uuid4(),
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
    id: uuid4(),
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

    coordinates: obj.geojson,

    serviceLevel: mapServiceLevel(obj.betjeningsgrad, obj),

    bedsExtra: obj.senger && obj.senger.ekstra
      ? obj.senger.ekstra
      : 0,
    bedsStaffed: obj.senger && obj.senger.betjent
      ? obj.senger.betjent
      : 0,
    bedsSelfService: obj.senger && obj.senger.selvbetjent
      ? obj.senger.selvbetjent
      : 0,
    bedsNoService: obj.senger && obj.senger.ubetjent
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

    // These will be set using processTags()
    htgtCarAllYear: false,
    htgtCarSummer: false,
    htgtBicycle: false,
    htgtPublicTransportAvailable: false,
    htgtBoatTransportAvailable: false,

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

  // Set english translation
  await setEnglishTranslation(obj, res, handler);

  // Set links
  setLinks(obj, res, handler);

  // Set facilities
  setFacilities(obj, res, handler);

  // Set accessibility
  setAccessibility(obj, res, handler);

  // Set opening hours
  setOpeningHours(obj, res, handler);

  // Set booking
  setBooking(obj, res, handler);

  // Set true/false if its a DNT cabin and if members get discount
  setDntCabin(obj, res, handler);

  // Set extra data based on tags
  processTags(obj, res, handler);

  // Areas and pictures
  res.areas = obj.områder;
  res.pictures = obj.bilder || [];

  return res;
}


export default {
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

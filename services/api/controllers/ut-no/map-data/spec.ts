
interface BaseSpec {
  orderOfFields: string[];
}

interface CabinSpec extends BaseSpec {
  isDnt: { [key: string]: string };
  serviceLevel: { [key: string]: string };
  facility: { [key: string]: string };
  htgt: { [key: string]: string };
}


interface PoiSpec extends BaseSpec {
  type: { [key: string]: string };
}


interface TripSpec extends BaseSpec {
  activityType: { [key: string]: string };
  grading: { [key: string]: string };
}


interface Spec {
  cabin: CabinSpec;
  poi: PoiSpec;
  trip: TripSpec;
}


export const htgtSpec = {
  carAllYear: 'a',
  carSummer: 'b',
  bicycle: 'c',
  publicTransportAvailable: 'd',
  boatTransportAvailable: 'e',
};


const cabinSpec: CabinSpec = {
  orderOfFields: [
    'id',
    'coordinates',
    'isDnt',
    'serviceLevel',
    'beds',
    'facilities',
    'htgt',
  ],
  serviceLevel: {
    'self-service': 'a',
    staffed: 'b',
    'no-service': 'c',
    closed: 'd',
    'food service': 'e',
    'no-service (no beds)': 'f',
    'emergency shelter': 'g',
    unknown: 'h',
  },
  isDnt: {
    true: 'd',
    false: '',
  },
  facility: {
    booking: 'a',
    water: 'b',
    'mobile coverage': 'c',
    'tent site': 'd',
    'bicycle rentals': 'e',
    rental: 'f',
    'local food': 'g',
    oven: 'h',
    shower: 'i',
    'credit card payment': 'j',
    'food service': 'k',
    heater: 'l',
    '12v': 'm',
    '220v': 'n',
    'wood stove': 'o',
    sauna: 'p',
    boat: 'q',
    wc: 'r',
    'drying room': 's',
    fishing: 't',
    fireplace: 'u',
    swimming: 'v',
    phone: 'w',
    canoe: 'x',
  },
  htgt: htgtSpec,
};


const poiSpec: PoiSpec = {
  orderOfFields: [
    'id',
    'coordinates',
    'type',
  ],
  type: {
    'train station': 'a',
    'picnic area': 'b',
    climbing: 'c',
    geocaching: 'd',
    'fording place': 'e',
    shelter: 'f',
    'sign point': 'g',
    'trip record': 'h',
    'bathing spot': 'i',
    orienteering: 'j',
    toilet: 'k',
    fishing: 'l',
    'ski lift': 'm',
    attraction: 'n',
    'mountain peak': 'o',
    hut: 'p',
    'public transport stop': 'q',
    campground: 'r',
    grotto: 's',
    parking: 't',
    'food service': 'u',
    'kiting area': 'v',
    'lookout point': 'w',
    bridge: 'x',
    'sledding hill': 'y',
  },
};


const tripSpec: TripSpec = {
  orderOfFields: [
    'id',
    'starting_point',
    'activity_type',
    'grading',
    'duration.minutes',
    'duration.days',
  ],
  activityType: {
    cycling: 'a',
    padling: 'b',
    climbing: 'c',
    'glacier trip': 'd',
    'ice skating': 'e',
    'ski touring': 'f',
    hiking: 'g',
  },
  grading: {
    easy: 'a',
    moderate: 'b',
    tough: 'c',
    'very tough': 'd',
  },
};


const spec: Spec = {
  cabin: cabinSpec,
  poi: poiSpec,
  trip: tripSpec,
};

export default spec;

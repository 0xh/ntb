import React from 'react';
import { Link } from 'react-router-dom';

import C from 'shared-components/Code';


const MapDataCompactTrip = () => (
  <div>
    <h1>GET /ut-no/map-data/compact/trip</h1>
    <p className="leading">
      Compact map data for trips.
      <br />
      Read about the spec and data format
      {' '}<strong><Link to="/ut-no/map-data/compact/spec">
        here
      </Link></strong>. A description of each of the fields for Trip is
      described below.
    </p>

    <h2>Filters</h2>
    <p>
      All of the filters described on the
      {' '}<Link to="/document/trip">Trip</Link> document type are available
      on this endpoint.
    </p>

    <h2><C>id</C></h2>
    <p>
      Id of the document in short-uuid format. Can be used to lookup the
      complete document using the <C>short_id</C>-filter.
    </p>

    <h2><C>starting_point</C></h2>
    <p>
      Latitude,Longitude coordinates using SRID 4326. Separated by comma.
      Has a precision of up to 6 decimals (meter precision).
    </p>

    <h2><C>activity_type</C></h2>
    <p>
      See the spec-json for a mapping of the activity type name to a single
      character.
    </p>

    <h2><C>grading</C></h2>
    <p>
      See the spec-json for a mapping of the grading name to a single
      character.
    </p>

    <h2><C>duration_minutes</C></h2>
    <p>
      Uses the formula <C>(duration.hours * 60) + duration.minutes</C> to
      create a number. The value is blank if the duration is 0 (zero).
    </p>

    <h2><C>duration_days</C></h2>
    <p>
      Number of days. The value is blank if the duration is 0 (zero).
    </p>
  </div>
);


export default MapDataCompactTrip;

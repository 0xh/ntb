import React from 'react';
import { Link } from 'react-router-dom';

import C from 'shared-components/Code';


const MapDataCompactCabin = () => (
  <div>
    <h1>GET /ut-no/map-data/compact/cabin</h1>
    <p className="leading">
      Compact map data for cabins.
      <br />
      Read about the spec and data format
      {' '}<strong><Link to="/ut-no/map-data/compact/spec">
        here
      </Link></strong>. A description of each of the fields for cabin is
      described below.
    </p>

    <h2>Filters</h2>
    <p>
      All of the filters described on the
      {' '}<Link to="/document/cabin">Cabin</Link> document type are available
      on this endpoint.
    </p>

    <h2><C>id</C></h2>
    <p>
      Id of the document in short-uuid format. Can be used to lookup the
      complete document using the <C>short_id</C>-filter.
    </p>

    <h2><C>coordinates</C></h2>
    <p>
      Latitude,Longitude coordinates using SRID 4326. Separated by comma.
      Has a precision of up to 6 decimals (meter precision).
    </p>

    <h2><C>is_dnt</C></h2>
    <p>
      Has the value of <C>d</C> if it&apos;s a DNT-cabin. If the value is
      blank, it&apos;s a private cabin.
    </p>

    <h2><C>service_level</C></h2>
    <p>
      See the spec-json for a mapping of the service level name to a single
      character.
    </p>

    <h2><C>beds</C></h2>
    <p>
      The number of beds on the cabin. If the cabin has no beds, the value is
      blank.
    </p>

    <h2><C>facilities</C></h2>
    <p>
      See the spec-json for a mapping of the facility name to a single
      character. If a cabin has multiple facilities, each of the characters
      will be present in the value, for example: <C>altuw</C> (five different
      facilities).
    </p>

    <h2><C>htgt</C></h2>
    <p>
      See the spec-json for a mapping of the htgt name to a single
      character. Includes all the characters that matches the cabins
      {' '}<strong>true</strong> values. If for example <C>car_summer</C> is
      <C>false</C>, it&apos;s character will not be included in the value.
    </p>
  </div>
);


export default MapDataCompactCabin;

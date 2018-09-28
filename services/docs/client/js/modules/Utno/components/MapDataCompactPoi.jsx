import React from 'react';
import { Link } from 'react-router-dom';

import C from 'shared-components/Code';


const MapDataCompactPoi = () => (
  <div>
    <h1>GET /ut-no/map-data/compact/poi</h1>
    <p className="leading">
      Compact map data for pois.
      <br />
      Read about the spec and data format
      {' '}<strong><Link to="/ut-no/map-data/compact/spec">
        here
      </Link></strong>. A description of each of the fields for Poi is
      described below.
    </p>

    <h2>Filters</h2>
    <p>
      All of the filters described on the
      {' '}<Link to="/document/poi">Poi</Link> document type are available
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

    <h2><C>type</C></h2>
    <p>
      See the spec-json for a mapping of the type name to a single
      character.
    </p>
  </div>
);


export default MapDataCompactPoi;

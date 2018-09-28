import React from 'react';
import { Link } from 'react-router-dom';

import C from 'shared-components/Code';


const MapDataCompactSpec = () => (
  <div>
    <h1>GET /ut-no/map-data/compact/spec</h1>
    <p className="leading">
      Returns a json with the spec for mapping the compact map data from the
      /map-data/compact-api to readable values.
    </p>

    <h2>About the custom data</h2>
    <p>
      For each of the document types <C>Cabin</C>, <C>Poi</C> and <C>Trip</C>,
      you can fetch a list of documents in a custom data format. One endpoint
      per document type (
        <Link to="/ut-no/map-data/compact/cabin">cabin</Link>,
        {' '}<Link to="/ut-no/map-data/compact/poi">poi</Link>,
        {' '}<Link to="/ut-no/map-data/compact/trip">trip</Link>
      ).
    </p>
    <p>
      The custom format has one document per line. Each line has multiple
      fields, where each field is separated by semi-colon <C>;</C>. Each
      document type has it&apos;s own configuration for which fields are
      included, and in what order the fields are sorted. If a field is empty,
      its value is blank, for example <C>first-value;;third-value</C> (the
      second value here is blank).
    </p>

    <h2>Order of fields</h2>
    <p>
      Each document type has a list of fields in the data output. The spec
      lists the order of the fields for each document as a string-array in
      {' '}<C>order_of_fields</C>.
    </p>

  </div>
);


export default MapDataCompactSpec;

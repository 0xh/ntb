import React from 'react';
import { Link } from 'react-router-dom';


const MapDataCompactSpecReverse = () => (
  <div>
    <h1>GET /ut-no/map-data/compact/spec/reverse</h1>
    <p className="leading">
      The same as <Link to="/ut-no/map-data/compact/spec">spec</Link>,
      just with reversed key/values. The code is the key, and the matching name
      is the value.
    </p>

  </div>
);


export default MapDataCompactSpecReverse;

import React, { Component } from 'react';
import { Route } from 'react-router';

import connect from 'lib/wrappedConnect';

import MapDataCompactSpec from './MapDataCompactSpec.jsx';
import MapDataCompactSpecReverse from './MapDataCompactSpecReverse.jsx';
import MapDataCompactCabin from './MapDataCompactCabin.jsx';
import MapDataCompactPoi from './MapDataCompactPoi.jsx';
import MapDataCompactTrip from './MapDataCompactTrip.jsx';


class Root extends Component {
  render() {
    return (
      <div className="content concept">
        <h3>ut-no</h3>
        <Route
          path="/ut-no/map-data/compact/spec"
          exact
          component={MapDataCompactSpec}
        />
        <Route
          path="/ut-no/map-data/compact/spec/reverse"
          component={MapDataCompactSpecReverse}
        />
        <Route
          path="/ut-no/map-data/compact/cabin"
          component={MapDataCompactCabin}
        />
        <Route
          path="/ut-no/map-data/compact/poi"
          component={MapDataCompactPoi}
        />
        <Route
          path="/ut-no/map-data/compact/trip"
          component={MapDataCompactTrip}
        />
      </div>
    );
  }
}


const ConnectedComponent = connect()(Root);
export default ConnectedComponent;

import React, { Component } from 'react';
import { Route } from 'react-router';

import connect from 'lib/wrappedConnect';

import Pagination from './Pagination.jsx';
import Fields from './Fields.jsx';
import Relations from './Relations.jsx';
import RelationParameters from './RelationParameters.jsx';
import RelationDepth from './RelationDepth.jsx';


class Root extends Component {
  render() {
    return (
      <div className="content concept">
        <h3>Concepts</h3>
        <Route path="/concepts/pagination" component={Pagination} />
        <Route path="/concepts/fields" component={Fields} />
        <Route path="/concepts/relations" component={Relations} />
        <Route
          path="/concepts/relation-parameters"
          component={RelationParameters}
        />
        <Route path="/concepts/relation-depth" component={RelationDepth} />
      </div>
    );
  }
}


const ConnectedComponent = connect()(Root);
export default ConnectedComponent;

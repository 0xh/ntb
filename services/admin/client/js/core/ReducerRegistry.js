// eslint-disable-next-line
// Based on https://github.com/insin/react-examples/tree/master/code-splitting-redux-reducers

class ReducerRegistry {
  constructor(initialReducers = {}) {
    this.reducers = { ...initialReducers };
    this.emitChange = null;
  }

  register(newReducers) {
    this.reducers = { ...this.reducers, ...newReducers };
    if (this.emitChange != null) {
      this.emitChange(this.getReducers());
    }
  }

  getReducers() {
    return { ...this.reducers };
  }

  setChangeListener(listener) {
    if (this.emitChange != null) {
      throw new Error('Can only set the listener for a ReducerRegistry once.');
    }
    this.emitChange = listener;
  }
}


export default ReducerRegistry;
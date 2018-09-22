import { connect } from 'react-redux';


export default (mapStateToProps = null, actions = {}) => connect(
  mapStateToProps || ((state) => ({})),
  actions,
  (stateProps, dispatchProps, ownProps) =>
    Object.assign({}, ownProps, stateProps, { actions: dispatchProps })
);
